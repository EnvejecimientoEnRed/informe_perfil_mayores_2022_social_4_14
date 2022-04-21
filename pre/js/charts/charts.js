//Desarrollo de las visualizaciones
import * as d3 from 'd3';
import { numberWithCommas3 } from '../helpers';
import { getInTooltip, getOutTooltip, positionTooltip } from '../modules/tooltip';
import { setChartHeight } from '../modules/height';
import { setChartCanvas, setChartCanvasImage } from '../modules/canvas-image';
import { setRRSSLinks } from '../modules/rrss';
import { setFixedIframeUrl } from './chart_helpers';

//Colores fijos
const COLOR_PRIMARY_1 = '#F8B05C',
COLOR_ANAG_PRIM_3 = '#9E3515';
let tooltip = d3.select('#tooltip');

export function initChart(iframe) {
    //Lectura de datos
    d3.csv('https://raw.githubusercontent.com/CarlosMunozDiazCSIC/informe_perfil_mayores_2022_social_4_14/main/data/ratio_plazas_residencias_espana_v2.csv', function(error,data) {
        if (error) throw error;

        data.sort(function(x, y){
            return d3.descending(+x.ratio, +y.ratio);
        });

        let margin = {top: 10, right: 10, bottom: 20, left: 102.5},
            width = document.getElementById('chart').clientWidth - margin.left - margin.right,
            height = document.getElementById('chart').clientHeight - margin.top - margin.bottom;

        let svg = d3.select("#chart")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        let x = d3.scaleLinear()
            .domain([0, 12])
            .range([ 0, width]);

        let xAxis = function(svg) {
            svg.call(d3.axisBottom(x).ticks(4));
            svg.call(function(g){
                g.selectAll('.tick line')
                    .attr('class', function(d,i) {
                        if (d == 0) {
                            return 'line-special';
                        }
                    })
                    .attr('y1', '0')
                    .attr('y2', `-${height}`)
            });
        }

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        let y = d3.scaleBand()
                .range([ 0, height ])
                .domain(data.map(function(d) { return d.ccaa_prov; }))
                .padding(.1);

        let yAxis = function(svg) {
            svg.call(d3.axisLeft(y));
            svg.call(function(g){g.selectAll('.tick line').remove()});
            svg.call(function(g){g.selectAll('.domain').remove()});
        }

        svg.append("g")
            .call(yAxis);

        function init() {
            svg.selectAll("bars")
                .data(data)
                .enter()
                .append("rect")
                .attr('class',function(d) {
                    return 'rect ' + d.ccaa_prov;
                })
                .attr("x", x(0) )
                .attr("y", function(d) { return y(d.ccaa_prov) + y.bandwidth() / 4; })
                .attr("width", function(d) { return x(0); })
                .attr("height", y.bandwidth() / 2 )
                .attr("fill", function(d) {
                    if (d.tipo != 'nacional') {
                        return COLOR_PRIMARY_1;
                    } else {
                        return COLOR_ANAG_PRIM_3;
                    }
                })
                .on('mouseover', function(d,i,e) {
                    //Opacidad de las barras
                    let bars = svg.selectAll('.rect');  
                    bars.each(function() {
                        this.style.opacity = '0.4';
                    });
                    this.style.opacity = '1';

                    //Display texto
                    let currentItem = this.classList[1];
                    let textItem = document.getElementsByClassName('text-'+currentItem)[0];
                    textItem.style.display = 'block';

                    //Texto
                    // let html = '<p class="chart__tooltip--title">' + d.NOMAUTO_2 + '</p>' + 
                    // '<p class="chart__tooltip--text">Un ' + numberWithCommas3(parseFloat(d.porc_total_grupo).toFixed(1)) + '% de habitantes de esta autonomía tiene 65 años o más.</p>' +
                    // '<p class="chart__tooltip--text">En cuanto a la división por sexos, un ' + numberWithCommas3(parseFloat(d.porc_total_hombres).toFixed(1)) + '% de los hombres y un ' + numberWithCommas3(parseFloat(d.porc_total_mujeres).toFixed(1)) + '% de las mujeres tiene 65 o más.</p>';
            
                    // tooltip.html(html);

                    //Tooltip
                    // positionTooltip(window.event, tooltip);
                    // getInTooltip(tooltip);
                })
                .on('mouseout', function(d,i,e) {
                    //Quitamos los estilos de la línea
                    let bars = svg.selectAll('.rect');
                    bars.each(function() {
                        this.style.opacity = '1';
                    });

                    //Display texto
                    let currentItem = this.classList[1];
                    let textItem = document.getElementsByClassName('text-'+currentItem)[0];
                    textItem.style.display = 'none';
                
                    //Quitamos el tooltip
                    //getOutTooltip(tooltip);
                })
                .transition()
                .duration(2000)
                .attr("width", function(d) { return x(+d.ratio); });

            //Prueba texto
            svg.selectAll('texto')
                .data(data)
                .enter()
                .append('text')
                .attr('class', function(d) {
                    return 'text text-' + d.ccaa_prov;
                })
                .attr("x", function(d) { return x(+d.ratio) + 5; })
                .attr("y", function(d) { return y(d.ccaa_prov) + 6.5; })
                .attr("dy", ".35em")
                .style('display','none')
                .text(function(d) { return numberWithCommas3(d.ratio) + '%'; });            
        }

        function animateChart() {
            svg.selectAll(".rect")
                .attr("width", function(d) { return x(0); })
                .transition()
                .duration(2000)
                .attr("width", function(d) { return x(+d.ratio); })
        }

        /////
        /////
        // Resto - Chart
        /////
        /////
        init();

        //Animación del gráfico
        document.getElementById('replay').addEventListener('click', function() {
            animateChart();
        });

        /////
        /////
        // Resto
        /////
        /////

        //Iframe
        setFixedIframeUrl('informe_perfil_mayores_2022_social_4_14','plazas_residenciales');

        //Redes sociales > Antes tenemos que indicar cuál sería el texto a enviar
        setRRSSLinks('plazas_residenciales');

        //Captura de pantalla de la visualización
        setChartCanvas();      

        let pngDownload = document.getElementById('pngImage');

        pngDownload.addEventListener('click', function(){
            setChartCanvasImage('plazas_residenciales');
        });

        //Altura del frame
        setChartHeight(iframe);
    });    
}