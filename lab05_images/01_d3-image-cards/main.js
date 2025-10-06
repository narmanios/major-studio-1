d3.json("./data.json").then((json) => {
  // execute the display images function
  displayImages(json);
});

let pictures = [
  "images/FS-5461_07.jpg",
  "images/FS-5497_04.jpg",
  "images/FS-5497_08.jpg",
];
let hexColors = [];

let getImageHex = function () {
  for (let i = 0; i < pictures.length; i++) {
    Vibrant.from(pictures[i]).getPalette(function (err, palette) {
      // console.log(pictures[i]);
      // console.log(palette);
      // console.log(palette["Vibrant"].getHex());
      hexColors.push(palette["Vibrant"].getHex());
    });
  }
  console.log(hexColors);
};

getImageHex();

Vibrant.from("images/FS-5461_07.jpg").getPalette(function (err, palette) {
  for (let swatch in palette) {
    // console.log(swatch);
    // console.log(palette[swatch].getHex());
  }

  let backgroundColor = palette["Vibrant"].getHex();
  let image = document.querySelectorAll(".image");
  console.log(image);
  for (let i = 0; i < image.length; i++) {
    if (image[i] !== null) {
      image[i].onclick = function () {
        document.body.style.backgroundColor = backgroundColor;
      };
    }
  }
});

//   let image = document.querySelectorAll(".image");
// for (let i = 0; i < image.length; i++) {
//   Vibrant.from(image[i].src).getPalette(function (err, palette) {
//     if (image[i] !== null) {
//       image[i].onclick = function () {
//         document.body.style.backgroundColor = palette["Vibrant"].getHex();
//       };
//     }
//   }});
// document.addEventListener("DOMContentLoaded", () => {
//   let image = document.querySelectorAll("img");

//   console.log("this is working", image);
// });
// for (let i = 0; i < image.length; i++) {
//   Vibrant.from(image[i].src).getPalette(function (err, palette) {
//     if (image[i] !== null) {
//       image[i].onclick = function () {
//         document.body.style.backgroundColor = palette["Vibrant"].getHex();
//       };
//     }
//   });
// }

// function to create all DOM elements
function displayImages(json) {
  // select a <div> with an id of "app"; this is where all images will be added
  let app = d3.select("#app");

  // sort the JSON data; date descending
  let data = json.sort((a, b) => (b.date > a.date ? 1 : -1));
  // date ascending
  // let data = json.sort((a, b) => (a.date > b.date) ? 1 : -1);

  // define "cards" for each item
  let card = app
    .selectAll("div.card")
    .data(data)
    .join("div")
    .attr("class", "card");

  // create a div with a class of "image" and populate it with an <img/> tag that contains the filepath
  card
    .append("div")
    .attr("class", "image")
    .append("img")
    .attr("src", (d) => {
      // all images are in the "images" folder which needs to be added to the filename
      return "./images/" + d.filename;
    });

  // create a paragraph that will hold the object date
  card
    .append("p")
    .attr("class", "object-date")
    .text((d) => d.date);

  // create a heading tag that will be the object title
  card
    .append("h2")
    .attr("class", "title")
    .text((d) => d.title);
}

let image = document.querySelectorAll(".image");
console.log(image);
