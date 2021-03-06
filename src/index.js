
const table = document.querySelector("#table")
const portList = document.querySelector("#portfolio_list")
const todayDateElement = document.querySelector("#today")
const revaluationNode = document.querySelector("#revaluation")
const valueDateTag = document.querySelector("#value-date")
const newForm = document.querySelector("#new_form")
const openSelection = document.querySelector("#open_new")
const openAccBtn = document.querySelector("#open_button")
const openingAmt = document.querySelector("#open_account")
let portfolioList = []
let fxList = []
let data = []
let dataLabels = []
let dataFigures = []
let dataPercentage = []
let fxIdRatesArray = []
let sum = 0
let todayDate = ""
let valueDate = ""

let histData = [['27/3', '29/3'], [45000, 45817.875]]


API.getPortfolios().then(portfolios => renderPortfolios(portfolios))
// API.getPortfolios().then(portfolios => console.log(portfolios))
API.getFXRates().then(fxrates => renderSelectOption(fxrates))

API.getHist().then(histories => createHistData(histories))

window.onload = () => {
  let today =  new Date()
  let dd = ("0" + today.getDate()).slice(-2) //二桁表示にするため全てに０を先頭に足してお尻から二桁取得
  let mm = ("0" + (today.getMonth() + 1)).slice(-2)　//二桁表示にするため全てに０を先頭に足してお尻から二桁取得
  let yyyy = today.getFullYear()
  todayDate = `${dd}/${mm}/${yyyy}`
  todayDateElement.innerText = `Today is ${todayDate}`
}

const dateFormat = (date) => {
  const year = date.slice(0,4)
  const month = date.slice(5,7)
  const day = date.slice(8,10)
  return `${day}/${month}/${year}`
}

/////////render portfolios\\\\\\\\\\\\\\\\\\\\
const renderPortfolios = (portfolios) => {
  portfolioList = portfolios
  valueDate = `${dateFormat(portfolios[0].updated_at)}`
  valueDateTag.innerText = `1. Your Portfolio (Currency Accounts) As of ${valueDate}`
  // valueDate != todayDate ? null : revaluationNode.removeChild(revaluationNode.firstElementChild)
  console.log(dateFormat(portfolios[0].updated_at))
  console.log(todayDate)
  portfolios.forEach(p => renderPortfolio(p));
  sum = dataFigures.reduce((accum, val) => accum + val, 0)     //once all the ports rendered, program comes back here hence sum can be calc
  renderSumtoYourPort(sum)
  calcPercentage(sum, dataFigures)
  //pass data to graph
  data.push(dataLabels)
  data.push(dataPercentage)
  drawGraph(data)
}

//////////render portfolio\\\\\\\\\\\\\\\\
const renderPortfolio = (p) => {
    
  const div = document.createElement("div")
  div.id = p.id
  div.className = "row1"
  const h3 = document.createElement("h3")
  h3.innerText = `${p.exchange.currency.slice(-3)}: ${p.local_amt.toLocaleString()}, which is equivalent to GBP: ${p.home_amt.toLocaleString()}`

  const dBtn = document.createElement("button")
  dBtn.innerText = "Close"
  dBtn.className = "button"
  dBtn.addEventListener("click", (e) => {
    deleteAcc(h3,div)
  })

  h3.insertAdjacentElement("beforeend", dBtn)
  div.append(h3)
  portList.appendChild(div)
  // すでに存在するアカウントの通過は全てその通過で名寄せする
  if (dataLabels.includes(p.exchange.currency.slice(-3))){
    let index = dataLabels.indexOf(p.exchange.currency.slice(-3))
    let currencyTotal = dataFigures[index] + p.home_amt
    // pushではなく、計算した通過合計値を使ってすでに存在する金額を同じインデックス番号に存在する金額
    dataFigures[index] = currencyTotal
  }
  else {
  dataLabels.push(`${p.exchange.currency.slice(-3)}`)
  dataFigures.push(p.home_amt)
  }
};

///////add sum line in your portfolio section\\\\\\\\\\
const renderSumtoYourPort = (sum) => {
  const div = document.createElement("div")
  div.id = "portfolio-total"
  div.className = "row2"
  const h3 = document.createElement("h3")
  h3.innerText = `The total amount of your portfolio is GBP: ${sum.toLocaleString()}`
  div.append(h3)
  portList.appendChild(div)
};

//////////calc % for graph\\\\\\\\\\\\
const calcPercentage = (sum, dataFigures) => {
  dataFigures.map(val => {dataPercentage.push(val/sum)}) 
  //dataFigures.map(val => {(val/sum)}) did not work. 3 undefineds stored in an array
}

///////////render option in 2\\\\\\\\\\\\\\\\\\\\
const renderSelectOption = (fxrates) => {
  console.log(fxrates)
  fxList = fxrates

  //タスク１：FXIDとRateだけのハッシュを作ってhome currencyベースの残高を作る際に使う
  fxIdRatesArray = fxrates.map(obj => ({[obj.id]: obj.rate })); 

  // タスク２：select optionの表示とタグ作り
  openSelection.innerHTML = " "　
  fxrates.forEach(r => { 
  const curOption = document.createElement("option")
  curOption.value = r.id  //https://stackoverflow.com/questions/1170386/passing-hidden-input-fields-in-html-select-option
  curOption.innerText = `${r.id}.${r.currency.slice(-3)}`
  curOption.className = `exchnage-${r.id}`
  openSelection.appendChild(curOption)
  })
};

///////////create vluation history\\\\\\\\\\\\\\\\\\\\
const createHistData = (histories) => {
  // debugger
  histData[0] = []
  histData[1] = []
  // sortするためどのキーを優先するかのリスト
  const order = [
    {key: "value_date", reverse: false}
  ];
  // reverse: falseで昇順
  const sortBy = (order) => {
    return (a, b) => {
      for (let i=0; i<order.length; i++) {
          const orderBy = order[i].reverse ? 1 : -1;
          if (a[order[i].key] < b[order[i].key]) return orderBy;
          if (a[order[i].key] > b[order[i].key]) return orderBy * -1;
      }
      return 0;
    };
  }
  // sortされたhashを使ってarrayを作成。直近の5日まで
  const sortedHistories = histories.sort(sortBy(order))
  sortedHistories.slice(-5).forEach(hist =>{
      histData[0].push(hist.value_date.slice(5,10))
      histData[1].push(hist.home_amt)
  })
  drawGraph2(histData);
}

//////////////open new account\\\\\\\\\\\\\\\\\\\
newForm.addEventListener("submit", (e) => {
  //back-end. Passimistic as i need id for rerendering portforlio
  const id = parseInt(openSelection.value.replace(/[^0-9]/g, ''));
  //Objectの配列から特定のキーに値が一致するものを取り出す　参考http://lifelog.main.jp/wordpress/?p=2557
  //to get key = id, check test.js file
  let fxRateforHomeValueCalc = fxIdRatesArray.filter(function(rate, index){
    if (Object.keys(rate) == id) return true;
  });
  
  const newAcc = {
    local_amt: openingAmt.value,
    home_amt: openingAmt.value / fxRateforHomeValueCalc[0][id],
    exchange_id: id
  };
  API.createNewAcc(newAcc).then(p => renderPortfolio(p))
  //to calc to include newly created port
  // sum = dataFigures.reduce((accum, val) => accum + val, 0)
  // calcPercentage(sum, dataFigures)
});

////////delete\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
const deleteAcc = (h3,div) => {
  //back-end
  const id = div.id
  console.log(id)
  API.deletePort(id)
  //front-end
  // h3.parentNode.remove()
  reRender()
}

const reRender = () => {
  
  portList.innerHTML = ""
  sum = 0
  data = []
  dataFigures = []
  dataLabels = []
  dataPercentage = []
  setTimeout("API.getPortfolios().then(portfolios => renderPortfolios(portfolios))", 500)
}

// const revaluation = () =>{
//   API.createNewHist({
//     home_amt: sum,
//     value_date: valueDate
//   })
//   // Passimistic
//   portfolioList.forEach(p => {
//     // debugger
//     let fxRateforHomeValueCalc = fxIdRatesArray.filter(function(rate, index){
//       if (Object.keys(rate) == p.exchange_id) return true;
//     });
//     // debugger
//     API.patchAcc({
//       home_amt: p.local_amt / fxRateforHomeValueCalc[0][p.exchange_id],
//     }, p.id)
//   })
//   // setTimeout("reRender()",500)
//   reRender()
// }

/////////////////////Graph\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
const drawGraph = function(data){
    const ctx = document.getElementById('graph').getContext('2d');
    const datas = {
      labels: data[0],
      datasets: [{
        backgroundColor: ["rgba(200,20,20,0.3)","rgba(20,200,20,0.3)","rgba(20,20,200,0.3)"],
        hoverBackgroundColor: ["rgba(250,20,20,0.3)","rgba(20,250,20,0.3)","rgba(20,20,250,0.3)"],
        data: data[1]
      }]
    };
    const config = {
      type: 'pie',
      data: datas
    };
    const myChart = new Chart(ctx, config);
  };
  
// drawGraph(data);

const drawGraph2 = function(data){
  let ctx = document.getElementById('graph2').getContext('2d');
  let myChart = new Chart(ctx, {
    type: 'line',
    data: { labels: data[0],
    datasets: [{ label:'Valuation', data:data[1],
                  fill: true,
                  backgroundColor: "rgba(200,30,30,0.4)",
                  borderColor: "rgba(230,10,10,1)",
                  lineTension: 0,
                  // 点の設定
                  pointBorderColor: "rgba(75,192,192,1)",          
                  pointBackgroundColor: "#fff",             
                  pointRadius: 5,
                  pointHoverRadius: 8,
                  pointHoverBackgroundColor: "rgba(75,192,192,1)",
                  pointHoverBorderColor: "rgba(220,220,220,1)",
                  pointHitRadius: 10
              }]
      }
    });
  };
  
  

  
