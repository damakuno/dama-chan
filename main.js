const { ipcRenderer, remote } = require('electron');
const app = remote.require('./app.js');
const d3 = require('d3');
//ipcRenderer.on('info' , (event , data) => { alert(data.msg) });

let question_header = document.getElementById('question_header');
let results_list = document.getElementById('results_list');
let poll = { id: null, question: "", options: [{ name: "", result: 0 }] }
let svg;
const svgWidth = 500;
const svgHeight = 300;
let chart_data = [];
window.onload = () => {
    svg = d3.select('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .attr('class', 'bar-chart');
};

ipcRenderer.on('poll-start', (e, data) => {
    poll = data;
    poll.question = `${poll.question.charAt(0).toUpperCase()}${poll.question.substr(1)}`
    question_header.innerHTML = poll.question;
    results_list.innerHTML = '';
    poll.options.forEach((val, index) => {
        let li = document.createElement("li");
        li.appendChild(document.createTextNode(`${val.name}`));
        li.setAttribute('id', `option_${index}`)
        results_list.appendChild(li);
    })
});

ipcRenderer.on('poll-vote', (e, data) => {
    poll.options = data;
    poll.options.forEach((val, index) => {
        let results_list_item = document.getElementById(`option_${index}`);
        results_list_item.innerHTML = `${val.name} : ${val.result}`;
        if (chart_data[index] === undefined) {
            chart_data.push(val.result);
        }
        else chart_data[index] = val.result;
    });
    _renderChart();
})

let bar_chart;
let barPadding = 10;
let data_length = () => {
    if (chart_data.length < 1) return 1
    else return chart_data.length
}
let barWidth = (svgWidth * 0.1) / data_length();

let _renderChart = () => {
    bar_chart = svg.selectAll('rect')
        .data(chart_data)

    bar_chart.enter()
        .append('rect')
        .merge(bar_chart)
        .attr('y', d => svgHeight - (d * (svgHeight * 0.1)))
        .attr('height', d => d * (svgHeight * 0.1))
        .attr('width', barWidth - barPadding)
        .attr('transform', (d, i) => {
            let translate = [barWidth * i, 0];
            return `translate(${translate})`;
        });

}