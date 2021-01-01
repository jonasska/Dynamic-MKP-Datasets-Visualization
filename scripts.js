var dynamicDatasets;
var currentDataset;
var currentDatasetMinValueRange;
var currentDatasetMaxValueRange;
var currentDatasetMinWeightRange;
var currentDatasetMaxWeightRange;

var chart1;
var currentState1;
var datasetGroups = [];
var seriesa1 = [];
var seriesa2 = [];
var seriesa3 = [];
var seriesa4 = [];

var chart2;
var currentState2;
var seriesb1 = [];
var seriesb2 = [];

var chart3;
var stateStart3 = 0;
var stateEnd3 = 1;
var itemStart3 = 0;
var itemEnd3 = 99;
var currentStates3Slice;
var multiSeriesDraw3 = [];
var multiSeriesRemove3 = [];

var chart4;
var itemUse = [];
var stateStart4 = 0;
var stateEnd4 = 1;
var itemStart4 = 0;
var itemEnd4 = 99;
var currentStates4Slice;
var multiSeriesDraw4 = [];
var multiSeriesRemove4 = [];

function normaliseValue100(min, max, value){
    const range = max-min;
    return (100*value/range)-(100*min/range);
}

function getSingleSliderValue(id){
    const slider = document.getElementById(id);
    return parseInt(slider.childNodes[3].value);
    
}

function getSingleSliderRange(id){
    const slider = document.getElementById(id);
    return {
        min: parseInt(slider.childNodes[3].min),
        max: parseInt(slider.childNodes[3].max),
    }
}

function getSingleSlider(id){
    return {
        id: id,
        range: getSingleSliderRange(id),
        value: getSingleSliderValue(id)
    }
}

function setSinlgleSlder({id, range:{min, max}, value}){
    const slider = document.getElementById(id);
    slider.childNodes[3].min = min;
    slider.childNodes[3].max = max;
    slider.childNodes[3].value = value;

    const sliderVal=normaliseValue100(min, max, value);
    const children = document.getElementById(id).childNodes[1].childNodes;
    children[3].style.right=(100-sliderVal)+'%';
    children[5].style.left=sliderVal+'%';
    children[7].style.left=sliderVal+'%';
    children[7].childNodes[1].innerHTML=value;
}

function getDoubleSliderValues(id){
    const slider = document.getElementById(id);
    return {
        value1: parseInt(slider.childNodes[3].value),
        value2: parseInt(slider.childNodes[5].value)
    }
}

function getDoubleSliderRange(id){
    const slider = document.getElementById(id);
    return {
        min: parseInt(slider.childNodes[3].min),
        max: parseInt(slider.childNodes[3].max),
    }
}

function getDoubleSlider(id){
    return {
        id: id,
        range: getDoubleSliderRange(id),
        values: getDoubleSliderValues(id)
    }
}

function setDoubleSlider({id, range:{min, max}, values:{value1, value2}}, {move, maxRange}={move:1, maxRange:undefined} ){
    const slider = document.getElementById(id);
    slider.childNodes[3].min = min;
    slider.childNodes[3].max = max;
    slider.childNodes[5].min = min;
    slider.childNodes[5].max = max;
    if(value1>value2){
        if(move == 1){
            if (value2>min){
                value1 = value2;
            }
            else {
                value1 = min;
                value2 = min;
            }
        }
        else {
            if (value1<max-1){
                value2 = value1;
            }
            else {
                value1 = max;
                value2 = max;
            }
        }
    }

    if(maxRange && value1+maxRange<value2){
        if(move == 1){
            value1 = value2-maxRange;
        }
        else {
            value2 = value1+maxRange;
        }
    }

    slider.childNodes[3].value = value1;
    slider.childNodes[5].value = value2;

    const children = slider.childNodes[1].childNodes;

    const sliderVal1=normaliseValue100(min, max, value1);
    children[1].style.width=sliderVal1+'%';
    children[5].style.left=sliderVal1+'%';
    children[7].style.left=sliderVal1+'%';
    children[11].style.left=sliderVal1+'%';
    children[11].childNodes[1].innerHTML=value1;

    const sliderVal2=normaliseValue100(min, max, value2);
    children[3].style.width=(100-sliderVal2)+'%';
    children[5].style.right=(100-sliderVal2)+'%';
    children[9].style.left=sliderVal2+'%';
    children[13].style.left=sliderVal2+'%';
    children[13].childNodes[1].innerHTML=value2;
}

function stateAndItemSubtitile(statesSlice, multiSeriesDraw){
    let statesPart = statesSlice[0].Name;
    let itemPart = multiSeriesDraw[0].name;
    if (statesSlice.length > 1){
        statesPart = `From ${statesSlice[0].Name} to ${statesSlice[statesSlice.length - 1].Name}`;
    }
    if (multiSeriesDraw.length > 1){
        itemPart = `from ${multiSeriesDraw[0].name} to ${multiSeriesDraw[multiSeriesDraw.length-1].name}`;
    }
    return `${statesPart}, ${itemPart}`;
}

document.getElementById("uploadInput").addEventListener("change", (event) => {
    const fileList = event.target.files;
    var reader = new FileReader();
    reader.onload = function(){
        var d = JSON.parse(reader.result);
        console.log(d);
        setOptions(d);
        processData();
    }
    reader.readAsText(fileList[0]);
});

document.getElementById("datasetsSelect").addEventListener("change", (event) => {
    var x = document.getElementById("datasetsSelect");
    var i = x.selectedIndex;
    currentDataset = dynamicDatasets[i];
    processData();
})

function setOptions(data){
    if (Array.isArray(data)){
        var x = document.getElementById("datasetsSelect");
        x.options.length = 0;
        data.forEach(dataset => {
            var c = document.createElement("option");
            c.text = dataset.ConfigName;
            x.options.add(c);
        })
        dynamicDatasets = data;
        currentDataset = data[0];
    }
    else {
        currentDataset = data;
    }
}

function calculateFullDatasetExtent(){
    let currentDatasetMinValue = Number.MAX_VALUE;
    let currentDatasetMaxValue = Number.MIN_VALUE;
    let currentDatasetMinWeight = Number.MAX_VALUE;
    let currentDatasetMaxWeight = Number.MIN_VALUE;
    currentDataset.States.forEach(state => {
        state.Items.forEach(item => {
            currentDatasetMinValue = currentDatasetMinValue > item.Val ? item.Val : currentDatasetMinValue;
            currentDatasetMaxValue = currentDatasetMaxValue < item.Val ? item.Val : currentDatasetMaxValue;
            currentDatasetMinWeight = currentDatasetMinWeight > item.AvgWt ? item.AvgWt : currentDatasetMinWeight;
            currentDatasetMaxWeight = currentDatasetMaxWeight < item.AvgWt ? item.AvgWt : currentDatasetMaxWeight;
        })
    });
    let valueMagnitude = Math.pow(10,Math.floor(Math.log10(currentDatasetMinValue)));
    currentDatasetMinValueRange = Math.floor(currentDatasetMinValue/valueMagnitude) * valueMagnitude;
    currentDatasetMaxValueRange = Math.ceil(currentDatasetMaxValue/valueMagnitude) * valueMagnitude;
    let weightMagnitude = Math.pow(10,Math.floor(Math.log10(currentDatasetMinWeight)));
    currentDatasetMinWeightRange = Math.floor(currentDatasetMinWeight/weightMagnitude) * weightMagnitude;
    currentDatasetMaxWeightRange = Math.ceil(currentDatasetMaxWeight/weightMagnitude) * weightMagnitude;
}

function showDivs(){
    const div1 = document.getElementById("visualization1");
    const div2 = document.getElementById("visualization2");
    const div3 = document.getElementById("visualization3");
    const div4 = document.getElementById("visualization4");

    let hasOptimalSolution = false;
    currentDataset.States[0].Items.forEach(item => {
        hasOptimalSolution = hasOptimalSolution || item.Opti == 1;
    });

    div1.style.display = "block";
    div3.style.display = "block";
    if(hasOptimalSolution){
        div2.style.display = "block";
        div4.style.display = "block";
    }
    else{
        div2.style.display = "none";
        div4.style.display = "none";
    }

}

function processData(){
    calculateFullDatasetExtent();
    showDivs()

    currentState1 = currentDataset.States[0];
    setSinlgleSlder({
        id: "slider1",
        range: {
            min: 0,
            max: currentDataset.States.length-1
        },
        value: 0
    });
    initialProcess1();
    processState1();
    renderChart1();

    currentState2 = currentDataset.States[0];
    setSinlgleSlder({
        id: "slider2",
        range: {
            min: 0,
            max: currentDataset.States.length-1
        },
        value: 0
    });
    processState2();
    renderChart2();


    stateStart3 = 0;
    stateEnd3 = currentDataset.States.length-1;
    currentStates3Slice = currentDataset.States.slice(stateStart3,stateEnd3);
    setDoubleSlider({
        id: "slider-states3",
        range: {
            min: 0,
            max: currentDataset.States.length-1
        },
        values: {
            value1: stateStart3,
            value2: stateEnd3,
        }
    });
    itemStart3 = 0;
    itemEnd3 = currentDataset.States[0].Items.length > 20 ? 20 : currentDataset.States[0].Items.length-1;
    setDoubleSlider({
        id: "slider-select3",
        range: {
            min: 0,
            max: currentDataset.States[0].Items.length-1
        },
        values: {
            value1: itemStart3,
            value2: itemEnd3,
        }
    });
    processState3();
    renderChart3();

    stateStart4 = 0;
    stateEnd4 = currentDataset.States.length-1;
    currentStates4Slice = currentDataset.States.slice(stateStart4,stateEnd4);
    setDoubleSlider({
        id: "slider-states4",
        range: {
            min: 0,
            max: currentDataset.States.length-1
        },
        values: {
            value1: stateStart4,
            value2: stateEnd4,
        }
    });
    itemStart4 = 0;
    itemEnd4 = currentDataset.States[0].Items.length > 20 ? 20 : currentDataset.States[0].Items.length-1;
    setDoubleSlider({
        id: "slider-select4",
        range: {
            min: 0,
            max: currentDataset.States[0].Items.length-1
        },
        values: {
            value1: itemStart4,
            value2: itemEnd4,
        }
    });
    initialProcess4();
    processState4();
    renderChart4();
}

slider1input = function(value){
    currentState1 = currentDataset.States[value];
    processState1();
    chart1.update({
        subtitle: {
            text: `${currentState1.Name}`
        },
        series: [
            {data: seriesa1},
            {data: seriesa2},
            {data: seriesa3},
            {data: seriesa4}
        ]
    })
}

function initialProcess1() {
    datasetGroups = [];
    var initialWeights = [];
    var initialValues = [];

    currentDataset.States[0].Items.forEach(item => {
        initialWeights.push(item.AvgWt);
        initialValues.push(item.Val);
    })

    initialWeights.sort((a, b) => a-b);
    initialValues.sort((a, b) => a-b);
    var medianWeight = initialWeights[initialWeights.length/2];
    var medianValue = initialValues[initialValues.length/2];

    currentDataset.States[0].Items.forEach((item, index) => {
        var group = 0;
        if (item.AvgWt > medianWeight){
            group +=2;
        }
        if (item.Val > medianValue){
            group +=1;
        }
        datasetGroups.push(group);
    })

}

function processState1(){
    seriesa1 = [];
    seriesa2 = [];
    seriesa3 = [];
    seriesa4 = [];

    currentState1.Items.forEach((item, index) => {
        if(datasetGroups[index] == 0){
            seriesa1.push([item.AvgWt, item.Val]);
        }
        if(datasetGroups[index] == 1){
            seriesa2.push([item.AvgWt, item.Val]);
        }
        if(datasetGroups[index] == 2){
            seriesa3.push([item.AvgWt, item.Val]);
        }
        if(datasetGroups[index] == 3){
            seriesa4.push([item.AvgWt, item.Val]);
        }
    });
}

function renderChart1() {
    chart1 = Highcharts.chart('chartContainer1', {

        chart: {
            zoomType: 'xy',
            type: 'scatter',
        },
    
        title: {
            text: `${currentDataset.Name} ${currentDataset.ConfigName}`
        },
    
        subtitle: {
            text: `${currentState1.Name}`
        },
    
        tooltip: {
            // headerFormat: '<b>{series.name}</b><br>',
            pointFormat: 'Average weight: {point.x}<br>Value: {point.y}',
            valueDecimals: 2
        },
    
        xAxis: {
            min: currentDatasetMinWeightRange,
            max: currentDatasetMaxWeightRange,
            title: {
                text: "Item average weight"
            }
        },
        yAxis: {
            min: currentDatasetMinValueRange,
            max: currentDatasetMaxValueRange,
            title: {
                text: "Item value"
            }
        },

        series: [
            {data: seriesa1},
            {data: seriesa2},
            {data: seriesa3},
            {data: seriesa4}
        ]
    
    });
}



slider2input = function(value) {
    currentState2 = currentDataset.States[value];
    processState2();
    chart2.update({
        subtitle: {
            text: `${currentState2.Name}`
        },
        series: [
            {data: seriesb1},
            {data: seriesb2},
        ]
    })
}

function processState2(){
    seriesb1 = [];
    seriesb2 = [];

    currentState2.Items.forEach((item, index) => {
        if(item.Opti == 1){
            seriesb1.push([item.AvgWt, item.Val]);
        }
        if(item.Opti == 0){
            seriesb2.push([item.AvgWt, item.Val]);
        }
    });
}

function renderChart2() {
    chart2 = Highcharts.chart('chartContainer2', {

        chart: {
            zoomType: 'xy',
            type: 'scatter',
        },
    
        title: {
            text: `${currentDataset.Name} ${currentDataset.ConfigName}`
        },
    
        subtitle: {
            text: `${currentState2.Name}`
        },
    
        tooltip: {
            // headerFormat: '<b>{series.name}</b><br>',
            pointFormat: 'Average weight: {point.x}<br>Value: {point.y}',
            valueDecimals: 2
        },
    
        xAxis: {
            min: currentDatasetMinWeightRange,
            max: currentDatasetMaxWeightRange,
            title: {
                text: "Item average weight"
            }
        },
        yAxis: {
            min: currentDatasetMinValueRange,
            max: currentDatasetMaxValueRange,
            title: {
                text: "Item value"
            }
        },
    
        series: [{
            data: seriesb1,
            name: 'Items part of optimal set',
            color: "rgb(236,126,47)"
        },
        {
            data: seriesb2,
            name: 'Items not part of optimal set',
            color: "rgb(67,113,190)"
        }]
    
    });
}


sliderStates3 = function({value1, value2}) {
    stateStart3 = Number(value1);
    stateEnd3 = Number(value2);
    updateChart3()
}

sliderSelect3 = function({value1, value2}) {
    itemStart3 = Number(value1);
    itemEnd3 = Number(value2);
    updateChart3()
}

function updateChart3() {
    currentStates3Slice = currentDataset.States.slice(stateStart3, stateEnd3+1);
    processState3();
    chart3.update({
        subtitle: {
            text: stateAndItemSubtitile(currentStates3Slice, multiSeriesDraw3) 
        },
        series: multiSeriesDraw3
    })
    multiSeriesRemove3.forEach(id => {
        var s = chart3.get(id);
            if(s) {
                s.remove();
            }
    });

    multiSeriesDraw3.forEach(series => {
        var s = chart3.get(series.id);
            if(!s) {
                chart3.addSeries(series);
            }
    });
}

function processState3(){
    multiSeriesDraw3 = [];
    multiSeriesRemove3 = [];
    currentStates3Slice[0].Items.forEach((item, index) => {
        if(index >= itemStart3 && index<= itemEnd3){
            const data = [];
            currentStates3Slice.forEach((state) =>{
                data.push([state.Items[index].AvgWt, state.Items[index].Val])
            })
            const itemSeries = {
                name: `Item ${index}`,
                data: data,
                id: index,
                // events: myCustomEvent
                lineWidth: 0.5,
            }
            multiSeriesDraw3.push(itemSeries);
        }
        else {
            multiSeriesRemove3.push(index);
        }

    })

}

function renderChart3() {
    chart3 = Highcharts.chart('chartContainer3', {

        chart: {
            zoomType: 'xy',
            type: 'line',
            height: '800px'
        },

        legend: {
            enabled: false
        },

        plotOptions: {
            series:{
                boostThreshold: 1,
            }
        },
        
        title: {
            text: `${currentDataset.Name} ${currentDataset.ConfigName}`
        },
    
        subtitle: {
            text: stateAndItemSubtitile(currentStates3Slice, multiSeriesDraw3) 
        },
    
        tooltip: {
            headerFormat: '<b>{series.name}</b><br>',
            pointFormat: 'Average weight: {point.x}<br>Value: {point.y}',
            valueDecimals: 2
        },
    
        xAxis: {
            min: currentDatasetMinWeightRange,
            max: currentDatasetMaxWeightRange,
            title: {
                text: "Item average weight"
            }
        },
        yAxis: {
            min: currentDatasetMinValueRange,
            max: currentDatasetMaxValueRange,
            title: {
                text: "Item value"
            }
        },

        series: multiSeriesDraw3
    
    });
}



sliderStates4 = function({value1, value2}) {
    stateStart4 = Number(value1);
    stateEnd4 = Number(value2);
    updateChart4()
}

sliderSelect4 = function({value1, value2}) {
    itemStart4 = Number(value1);
    itemEnd4 = Number(value2);
    updateChart4()
}

function updateChart4() {
    currentStates4Slice = currentDataset.States.slice(stateStart4, stateEnd4+1);
    processState4();
    chart4.update({
        subtitle: {
            text: stateAndItemSubtitile(currentStates4Slice, multiSeriesDraw4)  
        },
        series: multiSeriesDraw4
    })
    multiSeriesRemove4.forEach(id => {
        var s = chart4.get(id);
            if(s) {
                s.remove();
            }
    });

    multiSeriesDraw4.forEach(series => {
        var s = chart4.get(series.id);
            if(!s) {
                chart4.addSeries(series);
            }
    });
}

function initialProcess4() {
    itemUse = [];
    currentDataset.States[0].Items.forEach((item, itemIndex) => {
        let usedItem = false;
        let unusedItem = false;
        currentDataset.States.forEach((state) => {
            usedItem = usedItem || state.Items[itemIndex].Opti == 1;
            unusedItem = unusedItem || state.Items[itemIndex].Opti == 0;
        })
        if(usedItem){
            if(unusedItem){
                itemUse.push(1); // both used and unused
            }
            else{
                itemUse.push(2); // always used
            }
        }
        else {
            itemUse.push(0); // never used
        }
    })
}

function processState4(){
    multiSeriesDraw4 = [];
    multiSeriesRemove4 = [];
    currentStates4Slice[0].Items.forEach((item, index) => {
        if(index >= itemStart4 && index<= itemEnd4){
            const data = [];
            currentStates4Slice.forEach((state) =>{
                let color = "rgb(74, 74, 74)"; // never used
                if (itemUse[index]==1){
                    color = state.Items[index].Opti ? "rgb(236,126,47)" : "rgb(67,113,190)"; // color depends on item use
                } 
                else if (itemUse[index]==2){
                    color = "rgb(63, 242, 90)"; // item always used
                }
                data.push({
                    x: state.Items[index].AvgWt,
                    y: state.Items[index].Val,
                    name: state.Name,
                    color:  color
                })
            })
            const itemSeries = {
                name: `Item ${index}`,
                data: data,
                id: index,
                // events: myCustomEvent
                // lineWidth: 0.5,
            }
            multiSeriesDraw4.push(itemSeries);
        }
        else {
            multiSeriesRemove4.push(index);
        }

    })

}

function renderChart4() {
    chart4 = Highcharts.chart('chartContainer4', {

        chart: {
            zoomType: 'xy',
            type: 'scatter',
            height: '800px'
        },

        legend: {
            enabled: false
        },

        plotOptions: {
            series:{
                boostThreshold: 1000000,
                // lineWidth: 1
            }
        },
        
        title: {
            text: `${currentDataset.Name} ${currentDataset.ConfigName}`
        },
    
        subtitle: {
            text: stateAndItemSubtitile(currentStates4Slice, multiSeriesDraw4) 
        },
    
        tooltip: {
            headerFormat: '<b>{series.name}</b><br>',
            pointFormat: '<b>{point.name}</b><br>Average weight: {point.x}<br>Value: {point.y}',
            valueDecimals: 2
        },
    
        xAxis: {
            min: currentDatasetMinWeightRange,
            max: currentDatasetMaxWeightRange,
            title: {
                text: "Item average weight"
            }
        },
        yAxis: {
            min: currentDatasetMinValueRange,
            max: currentDatasetMaxValueRange,
            title: {
                text: "Item value"
            }
        },

        series: multiSeriesDraw4
    
    });
}