(function (window, document, undefined) {
      var nodes, mainData, force, divider = false, mapping = {};
          fill = d3.scale.category20();

          nodes = new Array();

      var vis = d3.select("div.viz").append("svg:svg")
          .attr("width", '100%')
          .attr("height", '99%'); 

      var freqData = (function () {
        var Data = new Array();
        var ID = 0, max;

        var setNode = function(uName, nodeID) {
          Data.push(Object.create(Object.prototype));
          Data[Data.length - 1]["uniqueName"] = uName;
          Data[Data.length - 1]["Freq"] = 1;
          Data[Data.length - 1]["id"] = nodeID;

          //Increment after setting ID
          ID++;
        }

        var incrementFreq = function(index) {
          Data[index].Freq++;
        }

        var isEqualAt = function(stringName) {
          for(elementIndex in Data) {
            if(Data[elementIndex].uniqueName == stringName) {
              return elementIndex;
            }
          }
          return -1;
        }

        var incrementCount = function(columnName) {
          var index = isEqualAt(columnName);
          (index == -1) ? setNode(columnName, ID) : incrementFreq(index);
        }

        var setMax = function(data) {
          var keys = Object.keys(data);
          max = data[keys[0]].Freq;
          for ( var i = 1; i < keys.length; i++) {
            if (max < data[keys[i]].Freq)
              max = data[keys[i]].Freq;
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
            //Reset ID and Data for population
            Data.splice(0, Data.length);

            data.forEach(function(d) {
              if(doSplit) {
                var cultures;
                if(d[selectedParameter])
                  cultures = d[selectedParameter].split(", ");
                for(node in cultures) {
                  if(cultures[node] != "" && cultures[node] != undefined && cultures[node] != null) incrementCount(cultures[node]);
                }
              }
              else {
                if(d[selectedParameter] != "" && d[selectedParameter] != undefined && d[selectedParameter] != null) incrementCount(d[selectedParameter]);
              }
            });
            setMax(Data);
            return Data;
          },
          getMax : function() {
            return max;
          }
        }
      })();

      menuButtons = new function() {
        var prevClickedId;
        var counter = 0;
        var currSelected;

        this.set = function(selector, nameArray) {
          for(name in nameArray) {
            $(selector).append('<a class="menuButton" id="' + counter + '" href="javascript:void(0)"><span class="menuText">' + nameArray[name] + '</span></a>');
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

      $.get('http://' + window.location.host + '/getdata' , function(data){
        data.metaData.columns.forEach(function(element) {
          mapping[element.header] = element.dataIndex;
        });

        mainData = data.assets;
        menuButtons.set(".menuContainer", Object.keys(mapping));
        //console.log(mainDatamapping["Culture"]);
        //console.log(mainData[200]);
        Array.prototype.push.apply(nodes, freqData.populate(mainData, mapping["Culture"]));
        //console.log(nodes.length);

        force = d3.layout.force()
          .nodes(nodes)
          .links([])
          .size([$('.viz').width(), $('.viz').height()])
          .charge(function(d, i){ return (d.Freq/freqData.getMax()) * -100;})
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
      });

      d3.select("body").on("click", function() {
        nodes.forEach(function(o, i) {
          o.x += (Math.random() - .5) * 40;
          o.y += (Math.random() - .5) * 40;
        });
        force.resume();
      });

      //on click
      function selectData(title) {
        //Remove nodes completely and add the new set
        nodes.splice(0, nodes.length);
        Array.prototype.push.apply(nodes, freqData.populate(mainData, mapping[title], divider));

        var node = vis.selectAll(".node")
               .data(force.nodes(), function(d) { return d.id;});

        node.enter().append("svg:circle")
          .attr("class", "node")
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { /*console.log(d);*/ return d.y; })
          .attr("r", function(d) { return (d.Freq/freqData.getMax()) * 20; })
          .style("fill", function(d, i) { return fill(i & nodes.length); })
          .style("stroke", function(d, i) { return d3.rgb(fill(i & nodes.length)).darker(2); })
          .style("stroke-width", 1.5)
          .call(force.drag);

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
            return '<p class="tooltip">' + d.uniqueName + '</p>';
              }
          });
      }
})(this, this.document);
