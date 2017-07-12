import * as d3 from "d3";

export default function() {
    var svg;
    var margins = { top: 50, left: 60, bottom: 50, right: 50 };
    var axes = { x: null, y: null };
    var threshold = 0;
    var associations = [];
    var size = [800, 300];
    var scales = { x: d3.scaleLinear(), y: d3.scaleLinear() };
    var region;
    var impactColorMap = { HIGH: "red", MODERATE: "orange", LOW: "green", MODIFIER: "blue" };
    var transitionDuration = 750;
    var drawThreshold, drawAxes, drawPoints, draw, prepareData, onMouseOverSnp, onMouseOutSnp,  highlightLegend;
    var showXAxis = true;
    var legendPadding = 15;
    var legend = [{symbol: d3.symbolCircle, type: 'INTRON' }, {symbol: d3.symbolTriangle, type: 'MISSENSE' }, {symbol: d3.symbolSquare , type: "SILENT"}]
    var highlightedAssociations = [];

    var colorScales = {
        impact: d3.scaleOrdinal()
            .domain(["HIGH", "MODERATE", "LOW", "MODIFIER"])
            .range(["red", "orange", "green", "blue"]),
        maf: d3.scaleOrdinal(d3.schemeCategory20c),
    };

    var activeColorScale = "impact";

    var position = function(d) { return d.snp.position; };
    var score = function(d) {  return d.score; };

    var getSnpClass = function(d) {
        var cls = "snp ";

        return cls;
    };

    var getAnnotationFromSnp = function(association) {
        var annotations = association.snp.annotations;
        if (annotations && annotations.length > 0) {
            return annotations[0];
        }
        return null;
    };

    var getSnpSize = function(d) {
        if (d.highlighted) {
            return 100;
        }
        return 50;
    };

    var getSnpOpacity = function(d) {
        if (d.highlighted) {
            return 1;
        }
        return 0;
    };

    var getSnpColor = function(d) {
        var value;
        if (activeColorScale === "impact") {
            var annotation = getAnnotationFromSnp(d);
            if (annotation) {
                value = annotation.impact;
            }
        } else if (activeColorScale === "maf") {
            value = d.maf;
        }
        return colorScales[activeColorScale](value);
    };

    var getSnpSymbolType = function(d) {
        var annotation = getAnnotationFromSnp(d);
        if (annotation) {
            if (annotation.function === "MISSENSE") {
                return d3.symbolTriangle;
            } else if (annotation.function === "SILENT") {
                return d3.symbolSquare;
            }
        }
        return d3.symbolCircle;
    };

    var positionSnp = function(d) {
        var xPos = scales.x(d.snp.position);
        var yPos = scales.y(d.score);
        return "translate(" + xPos + "," + yPos + ")";
    };

    var getPlotWidth = function() { return size[0] - margins.left - margins.right; };
    var getPlotHeight = function() {
        var h = size[1] - margins.top;
        if (showXAxis)  {
            h -= margin.bottom;
        }
        else {
            h -= 5;
        }
        return h;
    };

    function getKeyFromAssoc(d) {
        return "assoc_" + d.study.id + "_" + d.snp.chr + "_" + d.snp.position;
    }

    function onMouseOverSnp(d) {
        d.highlighted = true;
        svg.dispatch("highlightassociation", { detail: {snp: d, event: d3.event} });
    }

    function onMouseOutSnp(d) {
        d.highlighted = false;
        svg.dispatch("unhighlightassociation", { detail: {snp: d, event: d3.event} });
    }
    function findAssociation(association, lookup) {
        return lookup.filter(function(assoc) {
            return assoc.study.id === association.study.id && assoc.snp.chr === association.snp.chr && assoc.snp.position === association.snp.position;
        });
    }
    function  findAssociationByType(type, lookup) {
        return lookup.filter(function(assoc) {
            var annotation = getAnnotationFromSnp(assoc);
            if (annotation && annotation.function) {
                return annotation.function === type ;
            } else if (type === "INTRON") {
                return true;
            }
            return false;
        });
    }

    function highlightAssociation(node) {
        node.transition()
            .duration(100)
            .attr("d", d3.symbol()
                .type(getSnpSymbolType)
                .size(getSnpSize),
            )
            .style("fill-opacity", getSnpOpacity);
    }

    function unhighlightAssociations() {
        highlightedAssociations.forEach(function(assoc) {
            assoc.datum().highlighted = false;
            highlightAssociation(assoc);
        });
        highlightedAssociations = [];
    }

    function highlightAssociations(associations) {
        unhighlightAssociations();
        // first unhighlight the highlighted ones and then highlioght the highlighted ones
        associations.forEach(function(assoc) {
            assoc.highlighted = true;
            var assocNode = d3.select("#" + getKeyFromAssoc(assoc));
            highlightedAssociations.push(assocNode);
            highlightAssociation(assocNode);
        });
        highlightLegend(associations);
    }

    function chart(selection) {
        selection.each(function(data) {
            svg = d3.select(this);
            svg.append("defs").append("svg:clipPath")
                .attr("id", "manhattan-clip")
                    .append("svg:rect")
                        .attr("id", "clip-rect")
                        .attr("x", 0)
                        .attr("y", 0)
                        .attr("width", getPlotWidth())
                        .attr("height", getPlotHeight());

            draw = function() {
                prepareData();
                drawAxes();
                drawPoints();
                drawThreshold();
            };

            drawAxes = function() {
                svg.selectAll("g.x.axis").transition().duration(transitionDuration).call(axes.x);
                svg.selectAll("g.y.axis").transition().duration(transitionDuration).call(axes.y);
            };

            drawThreshold = function() {
                var thresholdLine = svg.select("g.manhattanplot")
                    .selectAll("line.threshold").data([threshold]);

                thresholdLine.exit().remove();

                thresholdLine.enter()
                    .append("line").attr("class", "threshold")
                    .style("stroke", "#F0001E").style("stroke-width", "1px")
                    .style("stroke-dasharray", "3,3")
                    .merge(thresholdLine)
                    .attr("x1", 0).attr("x2", getPlotWidth())
                    .attr("y1", scales.y(threshold))
                    .attr("y2", scales.y(threshold));
            };

            highlightLegend = function(highlightedSnps) {
                svg.select("g.legend")
                .selectAll("g.legend-item")
                .each(function(d) {
                    var isActive = findAssociationByType(d.type, highlightedSnps).length > 0;

                    d3.select(this)
                        .attr("opacity", (isActive ? 1 : 0.5))
                        .attr("font-weight", (isActive ? "bold" : "normal"));
                });
            };

            drawPoints = function() {
                svg.select("#clip-rect")
                    .attr("width", getPlotWidth())
                    .attr("height", getPlotHeight());
                var snps = svg.select("g.manhattanplot")
                    .selectAll("path.snp").data(associations, getKeyFromAssoc);

                snps.exit()
                    .attr("transform", positionSnp)
                    .transition(d3.transition().duration(transitionDuration))
                    .attr("transform", function(d) { return "translate(" + scales.x(position(d)) + ",-100)"; })
                    .style("fill-opacity", 0)
                    .remove();
                snps
                    .transition(d3.transition().duration(transitionDuration))
                    .attr("transform", positionSnp)
                    .attr("d", d3.symbol()
                        .type(getSnpSymbolType)
                        .size(getSnpSize),
                    )
                    .style("fill", getSnpColor);

                snps.enter()
                    .append("path")
                    .attr("class", getSnpClass)
                    .attr("d", d3.symbol()
                        .type(getSnpSymbolType)
                        .size(getSnpSize),
                    )
                    .attr("id", getKeyFromAssoc)
                    .style("stroke", getSnpColor)
                    .style("fill", getSnpColor)
                    .on("mouseover", onMouseOverSnp)
                    .on("mouseout", onMouseOutSnp)
                    .style("fill-opacity", 0)
                    .attr("transform", function(d) { return "translate(" + scales.x(position(d)) + ", "+ getPlotHeight() +")" ; })
                    .transition(d3.transition().duration(transitionDuration))
                    .attr("transform", positionSnp);

//
  //


            };

            prepareData = function() {
                var posDomain = region;
                if (!region) {
                    posDomain = d3.extent(associations, position);
                }
                var scoreMax = d3.max(associations, score);
                if (!scoreMax) {
                    scoreMax = 0;
                }
                scales.x.domain(posDomain).range([0, getPlotWidth()]);
                scales.y.domain([0, Math.max(scoreMax, threshold) + 1]).range([getPlotHeight(), 0]);
                axes.x = d3.axisBottom(scales.x);
                axes.y = d3.axisLeft(scales.y);
            };

            associations = data;
            // prepate data
            prepareData();

            // draw container
            var plotGroup = svg.append("g")
                .attr("class", "plot");
            // draw axes


            plotGroup.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(" + margins.left + "," + margins.top + ")")
                .call(axes.y);



            // draw label text
            if (showXAxis) {

                plotGroup.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(" + margins.left + "," + (size[1] - margins.bottom) + ")")
                    .call(axes.x);

                plotGroup.append("text")
                    .attr("class", "x label")
                    .attr("text-anchor", "middle")
                    .attr("x", (width)/2.0)
                    .attr("y", height - 10)
                    .text("Position (bp)");
            }

            plotGroup.append("text")
                .attr("class", "y label")
                .attr("transform", "rotate(-90)")
                .attr("y", 0).attr("x", 0 - (size[1] / 2))
                .attr("dy", "1.5em")
                .style("text-anchor", "middle")
                .text("-log10(pvalue)");

            plotGroup.append("g")
                .attr("class", "manhattanplot")
                .attr("transform", "translate(" + margins.left + "," + margins.top + ")")
                .attr("clip-path", "url(#manhattan-clip)");

            // draw legend
            var legendGroup = plotGroup
                .append("g")
                    .attr("class", "legend")
                    .attr("transform", "translate(" + (margins.left + 10) + ",10)");

            var runningWidth = 0;
            legendGroup.selectAll("g")
                .data(legend)
                .enter()
                .append("g")
                .attr("class", "legend-item")
                .attr("opacity", 0.5)
                .each(function(d, i) {
                    var legendItem = d3.select(this);
                    legendItem.append("path")
                    .attr("class", "legend")
                    .attr("d", d3.symbol().type(d.symbol).size(100))
                    .style("fill", "#fff")
                    .style("stroke", "black");

                    legendItem.append("text")
                    .attr("class", "legend")
                    .attr("x", "5")
                    .attr("y", 0)
                    .attr("dy", "0.4em")
                    .attr("dx", "0.7em")
                    .text(d.type)
                    .style("fill", "#000");
                    legendItem.attr("transform", "translate(" + (runningWidth ) + ",0)");
                    runningWidth += legendItem.node().getBoundingClientRect().width +  legendPadding;
                })
                .on("mouseover", function(d) {
                    highlightAssociations(findAssociationByType(d.type, associations));
                })
                .on("mouseout", function(d) {
                    highlightAssociations([]);
                });

            drawThreshold();
            drawPoints();

        });
    }

    chart.size = function(value) {
        if (!arguments.length) {
            return size;
        }
        size = value;
        scales.x.range([0, getPlotWidth()]);
        scales.y.range([getPlotHeight(), 0]);
        if (typeof draw === "function") {
            draw();
        }
    };

    chart.data = function(value) {
        if (!arguments.length) {
            return region;
        }
        associations = value;
        if (typeof draw === "function") {
            draw();
        }
        return chart;
    };

    chart.threshold = function(value) {
        if (!arguments.length) {
            return threshold;
        }
        threshold = value;
        if (typeof updateThreshold === "function") {
            updateThreshold();
        }
        return chart;
    };

    chart.showXAxis = function(value) {
        if (!arguments.length) {
            return showXAxis;
        }
        showXAxis = value;
    };

    chart.region = function(value) {
        if (!arguments.length) {
            return region;
        }
        region = value;
        return chart;
    };
    chart.highlightAssociations = function(value) {
        if (typeof highlightAssociations === "function") {
            highlightAssociations(value);
        }
    };

    return chart;
}