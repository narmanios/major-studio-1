// load the data
d3.json("data/dates_binned_start_year_upto_1810.json").then((data) => {


  // Define a condition function to filter for people older than 29
  const olderThan29 = function(d) {
    return d.age > 29;
  };
});
