const container = d3.select("div.container");

// Agregar un efecto de carga
container.append("div")
    .attr("class", "loader")
    .text("Loading...");

// Simular carga
setTimeout(() => {
    d3.select(".loader").remove();
    initializeMap();
}, 2000);

function initializeMap() {
    // Adding h1 title
    container.append("h1")
        .attr("id", "title")
        .text("US Educational Attainment");

    // Adding h3 description
    container.append("h3")
        .attr("id", "description")
        .text("Bachelor's degree or higher 2010-2014");

    // Tooltip
    const tooltip = container.append("div")
        .attr("id", "tooltip")
        .style("opacity", 0);

    tooltip.append("p").attr("class", "area");
    tooltip.append("p").attr("class", "education");

    // Margins
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // SVG container
    const svgContainer = container.append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);

    const svgCanvas = svgContainer.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Legend values
    const legendValues = {
        percentage: [3, 12, 21, 30, 39, 48, 57, 66],
        color: ["#E5F5E0", "#C7E9C0", "#A1D99B", "#74C476", "#41AB5D", "#238B45", "#006D2C", "#00441B"],
        height: 15,
        width: 30
    };

    // Legend
    const legend = svgCanvas.append("g")
        .attr("id", "legend")
        .attr("transform", `translate(${width - legendValues.percentage.length * legendValues.width}, 0)`);

    legend.selectAll("rect")
        .data(legendValues.percentage)
        .enter()
        .append("rect")
        .attr("width", legendValues.width)
        .attr("height", legendValues.height)
        .attr("x", (d, i) => i * legendValues.width)
        .attr("y", 0)
        .attr("fill", (d, i) => legendValues.color[i]);

    legend.selectAll("text")
        .data(legendValues.percentage)
        .enter()
        .append("text")
        .attr("x", (d, i) => i * legendValues.width)
        .attr("y", legendValues.height * 2)
        .style("font-size", "0.6rem")
        .text((d) => `${d}%`);

    // Color scale
    const colorScale = d3.scaleQuantize().range(legendValues.color);

    // Data URLs
    const URL_DATA = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";
    const URL_SVG = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";

    // Fetch and merge data
    fetch(URL_DATA)
        .then((response) => response.json())
        .then((json) => mergeData(json))
        .catch((error) => console.error("Error fetching education data:", error));

    function mergeData(data) {
        fetch(URL_SVG)
            .then((response) => response.json())
            .then((json) => {
                data.forEach((edu) => {
                    const county = json.objects.counties.geometries.find((geo) => geo.id === edu.fips);
                    if (county) Object.assign(county, edu);
                });
                return json;
            })
            .then((json) => drawMap(json))
            .catch((error) => console.error("Error fetching county data:", error));
    }

    // Draw the map
    function drawMap(data) {
        colorScale.domain([0, d3.max(data.objects.counties.geometries, (d) => d.bachelorsOrHigher)]);

        const feature = topojson.feature(data, data.objects.counties);
        const path = d3.geoPath();

        svgCanvas.selectAll("path")
            .data(feature.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("transform", `scale(0.82, 0.62)`)
            .attr("class", "county")
            .attr("data-fips", (d, i) => data.objects.counties.geometries[i].fips)
            .attr("data-education", (d, i) => data.objects.counties.geometries[i].bachelorsOrHigher)
            .attr("fill", (d, i) => colorScale(data.objects.counties.geometries[i].bachelorsOrHigher))
            .on("mouseenter", (d, i) => {
                // Obtener la posición del mouse relativa al SVG
                const [x, y] = d3.mouse(svgCanvas.node());

                // Mostrar el tooltip
                tooltip.style("opacity", 1)
                    .attr("data-education", data.objects.counties.geometries[i].bachelorsOrHigher)
                    .style("left", `${x + 15}px`) // Margen de 15px para evitar interferencia
                    .style("top", `${y + 15}px`); // Margen de 15px para evitar interferencia

                // Actualizar el contenido del tooltip
                tooltip.select("p.area")
                    .html(`<strong>${data.objects.counties.geometries[i].area_name}, ${data.objects.counties.geometries[i].state}</strong>`);
                tooltip.select("p.education")
                    .html(`<strong>Education:</strong> ${data.objects.counties.geometries[i].bachelorsOrHigher}%`);
            })
            .on("mouseout", () => tooltip.style("opacity", 0));
    }
}