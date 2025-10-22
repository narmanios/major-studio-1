d3.json("data/dataset_portrait_only.json")
  .then((data) => {
    const allMen = data.filter((d) =>
      d.indexed_topics.toLowerCase().includes("men")
    );

    const allWomen = data.filter((d) =>
      d.indexed_topics.toLowerCase().includes("women")
    );

    const allWatercolor = data.filter((d) =>
      d.physicalDescription.toLowerCase().includes("watercolor")
    );
    const allOil = data.filter((d) =>
      d.physicalDescription.toLowerCase().includes("oil")
    );
    const allPencil = data.filter((d) =>
      d.physicalDescription.toLowerCase().includes("pencil")
    );
    const allEtching = data.filter((d) =>
      d.physicalDescription.toLowerCase().includes("etching")
    );
    const allPrints = data.filter((d) =>
      d.indexed_object_types.toLowerCase().includes("print")
    );
    const allSilhouette = data.filter((d) =>
      d.objectType.toLowerCase().includes("silhouette")
    );
    // console.log(allMen);
    // console.log(allWomen);

    // console.log(allWatercolor);
    // console.log(allOil);
    // console.log(allPencil);
    // console.log(allEtching);
    // console.log(allPrints);
    // console.log(allSilhouette);

    ///////////// Filtering ///////////////////////

    var selectedTopics = []; // men / women
    var selectedMedia = []; // watercolor, oil, pencil, etching, print, silhouette

    // helpers
    function matchesTopic(item) {
      var s = String(item.indexed_topics || "").toLowerCase();
      for (var i = 0; i < selectedTopics.length; i++) {
        if (s.indexOf(selectedTopics[i]) !== -1) return true;
      }
      return false;
    }

    function matchesMedia(item) {
      var desc = String(item.physicalDescription || "").toLowerCase();
      var idx = String(item.indexed_object_types || "").toLowerCase();
      var obj = String(item.objectType || "").toLowerCase();

      for (var i = 0; i < selectedMedia.length; i++) {
        var m = selectedMedia[i];
        if (m === "print") {
          if (idx.indexOf("print") !== -1) return true;
        } else if (m === "silhouette") {
          if (obj.indexOf("silhouette") !== -1) return true;
        } else {
          // watercolor, oil, pencil, etching
          if (desc.indexOf(m) !== -1) return true;
        }
      }
      return false;
    }

    function computeCombined() {
      var combined = [];
      for (var i = 0; i < data.length; i++) {
        var item = data[i];
        var ok = false;
        if (selectedTopics.length > 0 && selectedMedia.length > 0) {
          // must match both a topic and a media
          ok = matchesTopic(item) && matchesMedia(item);
        } else if (selectedTopics.length > 0) {
          ok = matchesTopic(item);
        } else if (selectedMedia.length > 0) {
          ok = matchesMedia(item);
        } else {
          ok = false; // nothing selected -> no results
        }
        if (ok && combined.indexOf(item) === -1) combined.push(item);
      }
      return combined;
    }

    ///////////// Wiring the buttons ///////////////////////
    var ids = [
      "men",
      "women",
      "watercolor",
      "oil",
      "pencil",
      "etching",
      "print",
      "silhouette",
    ];
    ids.forEach(function (id) {
      var btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener("click", function () {
        // toggle into correct group
        if (id === "men" || id === "women") {
          var p = selectedTopics.indexOf(id);
          if (p === -1) {
            selectedTopics.push(id);
            btn.classList.add("active");
          } else {
            selectedTopics.splice(p, 1);
            btn.classList.remove("active");
          }
        } else {
          var q = selectedMedia.indexOf(id);
          if (q === -1) {
            selectedMedia.push(id);
            btn.classList.add("active");
          } else {
            selectedMedia.splice(q, 1);
            btn.classList.remove("active");
          }
        }

        var combined = computeCombined();
        console.log("selectedTopics:", selectedTopics);
        console.log("selectedMedia:", selectedMedia);
        console.log("combined count:", combined.length);
        console.log("combined matches:", combined);
      });
    });
  })
  .catch(function (err) {
    console.error("Failed to load JSON:", err);
  });
