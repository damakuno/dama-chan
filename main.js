const { ipcRenderer, remote } = require('electron');
const app = remote.require('./app.js');
const d3 = require('d3');
//ipcRenderer.on('info' , (event , data) => { alert(data.msg) });

let question_header = document.getElementById('question_header');
let results_list = document.getElementById('results_list');
let poll = { id: null, question: "", options: [{ name: "", result: 0 }] }
let svg;
const svgWidth = 600;
const svgHeight = 400;
let chart_data = [];
window.onload = () => {
    svg = d3.select('svg')
        .attr('width', svgWidth)
        .attr('height', svgHeight)
        .attr('class', 'bar-chart');

    if (app.checkPollActive()) {
        poll = app.getActivePoll();
        poll.question = `${poll.question.charAt(0).toUpperCase()}${poll.question.substr(1)}`
        question_header.innerHTML = poll.question;
        poll.options.forEach((val, index) => {
            if (chart_data[index] === undefined) {
                chart_data.push(val.result);
            }
            else chart_data[index] = val.result;
        });
        _renderChart();
    }
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
let barPadding = 30;
let data_length = () => {
    if (chart_data.length < 1) return 1
    else return chart_data.length
}
let barThickness = (svgWidth * 0.1) / data_length();

let name_text;
let get_available_name = (option) => { if (option.result > 0) return option.name; else return ''; }
let result_text;
let get_available_result = (option) => { if (option.result > 0) return option.result.toString(); else return ''; }

let _renderChart = () => {
    let data_max_value = Math.max(...chart_data)

    // let data_min_value = Math.min(...chart_data)

    // let data_linear_scale = d3.scaleLinear()
    //     .domain([data_min_value, data_max_value])
    //     .range([svgWidth * 0.05, svgWidth * 0.95])

    // let scaled_chart_data = chart_data.map(d => data_linear_scale(d))

    bar_chart = svg.selectAll('rect')
        .data(chart_data)

    bar_chart.enter()
        .append('rect')
        .merge(bar_chart)
        //.attr('x', d => svgWidth - (d * (svgWidth * 0.1))) <- to make chart go from right to left
        .attr('width', d => d * (svgWidth * 0.95 / data_max_value))
        .attr('height', barThickness - barPadding)
        .attr('transform', (d, i) => {
            let translate = [0, (barThickness * i) + 30];
            return `translate(${translate})`;
        });

    name_text = svg.selectAll('text.name_text')
        .data(poll.options)

    name_text.enter()
        .append('text')
        .merge(name_text)
        .attr('class', 'name_text')
        .attr('x', d => 10)
        .attr('y', (d, i) => { return (barThickness * i) + 10 })
        .attr("dy", ".75em")
        .text(d => get_available_name(d))

    result_text = svg.selectAll('text.result_text')
        .data(poll.options)

    result_text.enter()
        .append('text')
        .merge(result_text)
        .attr('class', 'result_text')
        .attr('x', (d, i) => { return chart_data[i] * (svgWidth * 0.95 / data_max_value) - 25 })
        .attr('y', (d, i) => { return (barThickness * i) + barPadding })
        .attr("dy", "1.25em")
        .text(d => get_available_result(d))
}

// let bar_chart;
// let barPadding = 10;
// let data_length = () => {
//     if (chart_data.length < 1) return 1
//     else return chart_data.length
// }
// let barWidth = (svgWidth * 0.1) / data_length();

// let _renderChart = () => {
//     bar_chart = svg.selectAll('rect')
//         .data(chart_data)

//     bar_chart.enter()
//         .append('rect')
//         .merge(bar_chart)
//         .attr('y', d => svgHeight - (d * (svgHeight * 0.1)))
//         .attr('height', d => d * (svgHeight * 0.1))
//         .attr('width', barWidth - barPadding)
//         .attr('transform', (d, i) => {
//             let translate = [barWidth * i, 0];
//             return `translate(${translate})`;
//         });

// }