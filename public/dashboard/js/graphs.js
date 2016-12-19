var countryDimension;
var worldGeoJson = {};
var monthDateFormat = d3.time.format("%b-%y");
var fullMonthDateFormat = d3.time.format("%B %Y");
var dateFormat = d3.time.format("%Y%m");

//Define charts in corresponding element placeholders
var dataTable = dc.dataTable("#data-table");
var shareBarChart = dc.barChart("#share-bar-chart");
var timeLineChart = dc.barChart("#time-line-chart");
var yearRingChart   = dc.pieChart("#year-ring-chart");
var quarterRingChart   = dc.pieChart("#quarter-ring-chart");


$(document).ready(function() {
  queue()
    .defer(d3.json, "./geojson/world-110.json")
  	.defer(d3.json, "../shipments/averages")
    .await(initializeData);
});

function initializeData(error,jsonData,avgs){
  if (error){
    console.warn("Could not initialize data");
    return ;
  }
  //Display world data first
  worldGeoJson = jsonData;
  onCountryChange(0);
  renderMap(null,avgs);
}

function onCommodityChange(code, partner){
	//show loader when querying for data
  d3.select("#loader").style("display","block");

  var queryString = "../shipments/commodity/" + code;
  if (+partner){
    queryString+= "?partner=" + partner;
  }
	//queue implemented to load data properly before rendering
	queue()
			.defer(d3.json, queryString)
      .await(rockAndRoll);

  queue()
    .defer(d3.json, "../shipments/worldAverage/"+code)
    .await(renderMap);
}


function onCountryChange(code,commodity){
	//show loader when querying for data
  d3.select("#loader").style("display","block");

  var queryString = "../shipments/partner/" + code;
  if (+commodity){
    queryString+= "?commodity=" + commodity;
  }
	//queue implemented to load data properly before rendering
	queue()
			.defer(d3.json, queryString)
      .await(rockAndRoll);
}


function rockAndRoll(error,data){
  //Hide loader
  d3.select("#loader").style("display","none");

  if (error){
    console.log(error);
    alert("Data could not be fetched");
    return;
  }

  console.log("Shipments: "+data.length);

  if (data.length==0){
    d3.selectAll("svg").remove();
    alert("No data to display for the current selection");
    return;
  }

	//Parse incoming data accordingly
	data.forEach(function(d){
    d.date = dateFormat.parse(d.period.toString());
    d.year = d.year;
    d.partner = d.partner;
    d.commodity = d.commodity;
    d.share = d3.round(+d["trade_value_start_exports"]/+d["trade_value_total"],2);
  });

  //Where the magic starts :)

	//Load data in for cross filtering
  var shipments = crossfilter(data);

	//Define dimensions to filter
  var dateDimension = shipments.dimension(function(d){
    return d.date;
  });
  var commodityDimension = shipments.dimension(function(d){
    return d.commodity;
  });

  countryDimension = shipments.dimension(function(d){
    return d.partner_code;
  });

  var filterDimension = shipments.dimension(function(d){
    return d.date;
  });
  var yearDim  = shipments.dimension(function(d) {return +d.year;});

  var quarterDim = shipments.dimension(function (d) {
      var month = d.date.getMonth();
      if (month <= 2) {
          return "Q1";
      } else if (month > 2 && month <= 5) {
          return "Q2";
      } else if (month > 5 && month <= 8) {
          return "Q3";
      } else {
          return "Q4";
      }
  });


  var shareDimension = shipments.dimension(function(d){
    return d.share;
  });
  var shareByDateDimensionSumGroup = dateDimension.group()
		.reduceSum(function(d) { return d.share; });

  var sharePerYearGroup = yearDim.group().reduceCount();

  var sharePerQuarterGroup = quarterDim.group().reduceCount();

	var shareByDateDimensionAvgGroup = dateDimension.group().reduce(
    // Add data in current filter
    function (p, v) {
        ++p.count;
        p.sum += v.share;
        p.avg = p.sum / p.count;
        return p;
    },
    //Remove data from actual filters
    function (p, v) {
        --p.count;
        p.sum -= v.share;
        p.avg = p.count ? p.sum / p.count : 0;
        return p;
    },
    //Initialize data
    function () {
        return {
            count: 0,
            sum: 0,
            avg: 0
        };
    }

	);


	//Max Min dates for axis
  var minDate = dateDimension.bottom(1)[0]["date"];
	var maxDate = dateDimension.top(1)[0]["date"];
	var minShare = 0;
	var maxShare = 1;

	//Data table definition
  dataTable.width(960).height(800)
    .dimension(dateDimension)
    .group(function(d){return "Market share"})
    .size(15)
    .columns([
			function (d){return monthDateFormat(d.date)},
      function (d){return d.partner_code},
      function (d){return d.commodity_code},
      function (d){return d.share}
    ])
    .sortBy(function(d){return d.date})
    .order(d3.ascending);

	//Main bar chart displaying market share
	shareBarChart.width(window.innerWidth*0.7).height(240)
    .margins({top: 10, right: 10, bottom: 20, left: 40})
    .dimension(shareDimension)
    .group(remove_empty_bins(shareByDateDimensionAvgGroup))
		.valueAccessor(function(p) { return p.value.avg;})
    .transitionDuration(500)
    .centerBar(true)
    .xAxisPadding (20)
    .brushOn(false)
    .elasticX(true)
    .renderHorizontalGridLines(true)
    .x(d3.time.scale().domain([minDate, maxDate]))
		.xUnits(function(){return 90;})
		.y(d3.scale.linear().domain([minShare,maxShare]))
    .title(function(d){ return ''; });

  //Timeline for selecting dates upon dragging
  timeLineChart.width(window.innerWidth*0.6).height(80)
      .margins({top: 10, right: 10, bottom: 20, left: 40})
      .dimension(filterDimension)
      .mouseZoomable(true)
      .group(shareByDateDimensionAvgGroup)
			.valueAccessor(function(p) {
		    return p.value.avg;
			})
      .transitionDuration(300)
      .turnOnControls(true)
      .brushOn(true)
      .x(d3.time.scale().domain([minDate, maxDate]))
      .xUnits(function(){return 90;})
			.y(d3.scale.linear().domain([0,0.5]))
      .yAxis().ticks(0);


  //Filter by year donut
  yearRingChart.width(320).height(150)
      //.margins({top: 10, right: 10, bottom: 20, left: 10})
      .dimension(yearDim)
      .group(sharePerYearGroup)
      .innerRadius(20)
      .colors(chartScale)
      .controlsUseVisibility(true);

  //Filter by quarter donut
  quarterRingChart.width(320).height(150)
      //.margins({top: 10, right: 10, bottom: 20, left: 10})
      .dimension(quarterDim)
      .group(sharePerQuarterGroup)
      .innerRadius(20)
      .colors(chartScale)
      .controlsUseVisibility(true);


	//Hide loader once we are ready to draw!
	d3.select("#loader").style("display","none");

	//Here we go!
  dc.renderAll();
  d3.selectAll('.bar')
    .call(tip)
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide);
}

function renderMap(error, avgs){
    //Define projection for map. Let's play it conservative. Mercator one :|
    var projection = d3.geo.mercator()
        .center([15, -10])
        .scale(120)
        .rotate([0,0]);

    $( "svg" ).remove( "#ocean-layer" );

    var svgMap = d3.select("#map").append("svg")
        .attr("width", 1080)
        .attr("height", 400)
        .attr("id", "ocean-layer");

    var tooltip = d3.select("#month-bar-chart").append("div");

    var path = d3.geo.path()
        .projection(projection);

    var g = svgMap.append("g");

    // load and display world data
    var countries = topojson.feature(worldGeoJson, worldGeoJson.objects.countries).features;
    g.selectAll("path")
      .data(countries)
    .enter()
      .append("path")
      .attr("d", path)
      .attr("country-code", function(d){return d.id} )
      .style("fill", function(d, i) {
          var avg = 0;
          country = avgs.filter(function(v) {
            var code = v.country;
            if (code[0])
              code = v.country[0];
             return code === d.id;
           });
          if (country && country[0] && country[0].avgAmount)
            avg = country[0].avgAmount;
          return mapColorScale(avg); })
      .on("mousemove", function(d) {
          var mouse = d3.mouse(svgMap.node()).map(function(d) {
            return parseInt(d);
          });
          d3.select(this).style({"stroke":"#333", "stroke-width": "1px"});
          country = avgs.filter(function(v) {
            var code = v.country;
            if (code[0])
              code = v.country[0];
             return code === d.id;
          });
          var avg = 0;
          if (country && country[0] && country[0].avgAmount)
           avg = country[0].avgAmount;
          tooltip.html(d3.round(avg*100)+"%");
      })
      .on("mouseout", function(d, i) {
        d3.selectAll("path")
          .style({
              "stroke":"white",
              "stroke-width": "0.25px"
          });
    });

    //Zooming capabilities in and out
    var zoom = d3.behavior.zoom()
      .on("zoom",function() {
        g.attr("transform","translate("+
          d3.event.translate.join(",")+")scale("+d3.event.scale+")");
        g.selectAll("path")
          .attr("d", path.projection(projection));
    });
    svgMap.call(zoom);
}


var greenRange = ["#ccece6","#99d8c9","#66c2a4","#41ae76","#238b45"];
var violetRange = ["#fff", "#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1", "#54278f"];

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d,i) {
    console.log(d.data);
    return "<strong>" +  fullMonthDateFormat(d.data.key) + ": </strong>" +
      "<span style='color:#359980;'>" + d3.round(d.data.value.avg * 100) + "%</span> ";
  });

var chartScale = d3.scale.ordinal().range(greenRange);
var mapColorScale = d3.scale.threshold()
    .domain([0.2, 0.3, 0.4, 0.5, 0.7])
    .range(violetRange);

//Use to filter data and display time axis (x) reload.
function remove_empty_bins(source_group) {
    return {
        all:function () {
            return source_group.all().filter(function(d) {
              return d.value.avg != 0;
            });
        }
    };
};
