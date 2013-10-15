(function (window, document, undefined) {
  var artstorJs = {
    listClick: function(id) {
      window.location.href = 'http://' + window.location.host + '/slider/' + id;
    },
  }

  //Assign artstorJs to be accesible in global scope via window
  window.artstor = artstorJs;
})(this, this.document);
