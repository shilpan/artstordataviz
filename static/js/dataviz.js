(function (window, document, undefined) {
      var nodes, mainData, force, divider = false, mapping = {}, zoomLevel = 1;
          fill = d3.scale.category20();

          nodes = new Array();

      var vis = d3.select("div.viz").append("svg:svg")
          .attr("width", '100%')
          .attr("height", '99%');

      var freqData = (function () {
        var Data = new Array();
        var ID = 0, max, totalNodes;

        var setNode = function(uName, nodeID, node) {
          Data.push(Object.create(Object.prototype));
          Data[Data.length - 1]["uniqueName"] = uName;
          Data[Data.length - 1]["Freq"] = 1;
          Data[Data.length - 1]["id"] = nodeID;
          Data[Data.length - 1]["dataPoint"] = [node];

          //Increment after setting ID
          ID++;
        }

        var incrementFreq = function(index, node) {
          Data[index].Freq++;
          Data[index].dataPoint.push(node);
        }

        var isEqualAt = function(stringName) {
          for(elementIndex in Data) {
            if(Data[elementIndex].uniqueName == stringName) {
              return elementIndex;
            }
          }
          return -1;
        }

        var incrementCount = function(columnName, node) {
          var index = isEqualAt(columnName);
          (index == -1) ? setNode(columnName, ID, node) : incrementFreq(index, node);
        }

        var setMax = function(data) {
          max = data[0].Freq;
          for ( var i = 1; i < data.length; i++) {
            if (max < data[i].Freq)
              max = data[i].Freq;
          }
        }

        return {
          length: function() {
            return Data.length;
          },
          get: function() {
            return Data;
          },
          populate: function(data, selectedParameter, doSplit) {
            console.log(data);
            //Reset ID and Data for population
            Data.splice(0, Data.length);

            totalNodes = data.length;
            data.forEach(function(d) {
              if(doSplit) {
                var cultures;
                if((selectedParameter == mapping["Created By"]) ? mainData.metaData.profiles[d[selectedParameter]] : d[selectedParameter])
                  cultures = ((selectedParameter == mapping["Created By"]) ? mainData.metaData.profiles[d[selectedParameter]] : d[selectedParameter]).split(", ");
                for(node in cultures) {
                  if(cultures[node] != "" && cultures[node] != undefined && cultures[node] != null)
                    incrementCount(cultures[node], d);
                }
              }
              else {
                if(d[selectedParameter] != "" && d[selectedParameter] != undefined && d[selectedParameter] != null)
                  incrementCount((selectedParameter == mapping["Created By"]) ? mainData.metaData.profiles[d[selectedParameter]] : d[selectedParameter], d);
              }
            });
            setMax(Data);
            return Data;
          },
          getMax : function() {
            return max;
          },
          getTotalNodes: function() {
            return totalNodes;
          }
        }
      })();

      menuButtons = new function() {
        var prevClickedId;
        var counter = 0;
        var currSelected;

        this.set = function(selector, nameArray) {
          for(name in nameArray) {
            $(selector).append('<div class="buttonContainer">' +
                                            '<a class="menuButton" id="' + counter + '" href="javascript:void(0)"><span class="menuText">' + nameArray[name] + '</span></a>' +
                                            '<a class="exitButton" href="javascript:void(0)"><img class="exitImage" src="../static/img/close_button.png" /></a>' +
                                          '</div>');
            counter++;
          }

          $(".menuContainer").on("click", ".menuButton", function(event){

            currSelected = this.getElementsByClassName('menuText')[0].innerHTML;
            selectData(currSelected);

            $(this).css('opacity', 1);

            if(prevClickedId != null) {
              $('#' + prevClickedId).css('opacity', 0.7);
            }

            prevClickedId = $(this).attr('id');
          });

          $(".menuContainer").on("click", ".exitButton", function(event){
            $(this.parentNode).remove();
          });
        }

        this.getCurrentSelected = function() {
          return currSelected;
        }
      }

      //Always set after first click is simulated
      dividerButton = new function() {
        this.set = function() {
          $('#toggleDivider').on("click", function(event){
            if(this.getElementsByClassName('menuText')[0].innerHTML == "Divider off"){
              divider = true;
              this.getElementsByClassName('menuText')[0].innerHTML = "Divider on";
            }
            else {
              divider = false;
              this.getElementsByClassName('menuText')[0].innerHTML = "Divider off"; 
            }

            selectData(menuButtons.getCurrentSelected());
          });
        }
      }

      function staggeredLoad(data, current, finalData) {
        var endLimit;
        if (current == undefined)
          current = data.from;

        if (finalData == undefined) {
          finalData = {};
          finalData.assets = [];
        }

        if ((data.to - data.from - current) > 256)
          endLimit = current + 256;
        else
          endLimit = data.to;

        $.get('http://' + window.location.host + '/getdata' , {from: current, to: endLimit}, function(dataObject){
          $(".progress-bar").css("width", (endLimit/(data.to - data.from))*100 + "%");
          finalData.assets = finalData.assets.concat(dataObject.assets);

          if (endLimit === data.to) {
            finalData.metaData = dataObject.metaData;
            finalData.results = dataObject.results;
            finalData.success = dataObject.success;

            $(".progress").remove();
            $(".viz").css('display', 'inline');
            $(".panel").css('display', 'inline');

            console.log(finalData);
            setUpDataViz(finalData);
          } else {
            staggeredLoad(data, endLimit, finalData);
          }
        });
      }

      $.get('http://' + window.location.host + '/bounds' , function(data) {
        // $.get('http://' + window.location.host + '/getdata' , {from: data.from, to: data.to}, function(data){
        //   setUpDataViz(data);
        // });
        staggeredLoad(data);
      });

      d3.select("body").on("click", function() {
        nodes.forEach(function(o, i) {
          o.x += (Math.random() - .5) * 40;
          o.y += (Math.random() - .5) * 40;
        });
        force.resume();
      });

      function setUpDataViz(data) {
        data.metaData.columns.forEach(function(element) {
          mapping[element.header] = element.dataIndex;
        });

        mainData = data;
        menuButtons.set(".menuContainer", Object.keys(mapping));
        //console.log(mainDatamapping["Culture"]);
        //console.log(mainData[200]);
        Array.prototype.push.apply(nodes, freqData.populate(mainData.assets, mapping["Culture"]));
        //console.log(nodes.length);

        force = d3.layout.force()
          .nodes(nodes)
          .links([])
          .size([$('.viz').width(), $('.viz').height()])
          .charge(function(d, i){ return (d.Freq/freqData.getMax()) * -500;})
          .start();

        //Simulate click on the first element
        $("#3").click();

        //Set the current divider with reference to the current selected
        dividerButton.set();

        vis.style("opacity", 1e-6)
          .transition()
          .duration(1000)
          .style("opacity", 1);

        force.on("tick", function() {
          var node = vis.selectAll("circle.node");
          node.attr("cx", function(d) { return d.x; })
              .attr("cy", function(d) { return d.y; });
        });

        setToolTip();

        $(window).resize(function() {
          force.size([$('.viz').width(), $('.viz').height()]);
          force.start();
        });

        $('#zoom-in').click(function() {
          zoomLevel++;
          selectData(menuButtons.getCurrentSelected());
        });

        $('#zoom-out').click(function() {
            zoomLevel--;
            selectData(menuButtons.getCurrentSelected());
        });
      }

      //on click
      function selectData(title) {
        //Remove nodes completely and add the new set
        nodes.splice(0, nodes.length);
        Array.prototype.push.apply(nodes, freqData.populate(mainData.assets, mapping[title], divider));
        console.log(nodes);
        var node = vis.selectAll(".node")
               .data(force.nodes(), function(d) { return d.id;});

        node.enter().append("svg:circle")
          .attr("class", "node")
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { /*console.log(d);*/ return d.y; })
          .attr("r", function(d) { return (d.Freq/freqData.getMax()) * 60 * zoomLevel; })
          .style("fill", function(d, i) { return fill(i % nodes.length); })
          .style("stroke", function(d, i) { return d3.rgb(fill(i % nodes.length)).darker(2); })
          .style("stroke-width", 1.5)
          .call(force.drag)
          .on("click", function(d) {
            console.log("clicked");
            $(".container").append(
              '<div id="overlay-content">' +
                '<div id="modal"></div>' +
                '<div id="content">' +
                  '<a class="exitButton" href="javascript:void(0)"><img class="exitImage" src="../static/img/close_button.png" /></a>' +
                  '<table class="table-bordered">' +
                    '<tbody class="listedIds">'+
                      '<tr><td><b>IDs</b></td></tr>' +
                    '</tbody>' +
                  '</table>' +
                '</div>' +
              '</div>');


            //Set click for close button
            $(".container").on("click", ".exitButton", function(event){
              $(this.parentNode.parentNode).remove();
            });

            //Add all IDs
            d.dataPoint.forEach(function(element) {
              $(".listedIds").append('<tr><td >' + element.id + '</td></tr>');
            });
          });

        node.exit().remove();

        force.start();
        setToolTip();
      }

      function setToolTip() {
        $('.node').tipsy({
              gravity: 'w',
              html: true,
              title: function() {
            var d = this.__data__;
            return '<p class="tooltip">Name: ' + d.uniqueName + ', Freq: ' + d.Freq + '</p>';
              }
          });
      }
})(this, this.document);
