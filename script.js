let appState = {
    savingsAmount: 600000,
    interestRate: [0.07, 0.08],
    downPaymentPercentage: 0.2,
    closingCostPercentage: [0.04, 0.07],
    additionalUpfrontCosts: [0, 50000],
    annualBaseIncome: [250000, 350000],
    annualBaseExpense: [80000, 150000],
    additionalAnnualIncome: [0, 50000],
    additionalAnnualCosts: [20000, 80000],
    propertyGrowthRate: [-0.04, 0.06],
    inflationRate: [0, 0.04],
    years: 20,
    targetIRR: 0.065
};

function createInputElements() {
    // Slider inputs
    createSliderInput('savingsAmount', 100000, 1000000, 10000, appState.savingsAmount, 'Savings Amount ($):');
    createSliderInput('downPaymentPercentage', 0.1, 0.3, 0.01, appState.downPaymentPercentage, 'Down Payment (%):');
    createSliderInput('years', 5, 30, 1, appState.years, 'Years:');
    createSliderInput('targetIRR', 0.05, 0.1, 0.005, appState.targetIRR, 'Target IRR (%):');

    // Range inputs
    createRangeInput('interestRate', 0, 0.1, 0.01, appState.interestRate, 'Interest Rate Range (%):');
    createRangeInput('closingCostPercentage', 0, 0.1, 0.01, appState.closingCostPercentage, 'Closing Cost % Range:');
    createRangeInput('additionalUpfrontCosts', 0, 100000, 5000, appState.additionalUpfrontCosts, 'Additional Upfront Costs Range ($):');
    createRangeInput('annualBaseIncome', 100000, 500000, 10000, appState.annualBaseIncome, 'Annual Base Income Range ($):');
    createRangeInput('annualBaseExpense', 50000, 200000, 10000, appState.annualBaseExpense, 'Annual Base Expense Range ($):');
    createRangeInput('additionalAnnualIncome', 0, 100000, 5000, appState.additionalAnnualIncome, 'Additional Annual Income Range ($):');
    createRangeInput('additionalAnnualCosts', 10000, 100000, 5000, appState.additionalAnnualCosts, 'Additional Annual Costs Range ($):');
    createRangeInput('propertyGrowthRate', -0.1, 0.1, 0.01, appState.propertyGrowthRate, 'Property Growth Rate Range (%):');
    createRangeInput('inflationRate', 0, 0.1, 0.01, appState.inflationRate, 'Inflation Rate Range (%):');
}

function createSliderInput(id, min, max, step, defaultValue, labelText) {
    const container = document.getElementById(id + 'Container');
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;
    const input = document.createElement('input');
    input.type = 'range';
    input.id = id;
    input.name = id;
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = defaultValue;
    input.addEventListener('input', handleInputChange);
    container.appendChild(label);
    container.appendChild(input);
}

function createRangeInput(id, min, max, step, defaultValues, labelText) {
    const container = document.getElementById(id + 'Container');
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;

    // Start Range Input
    const startInput = document.createElement('input');
    startInput.type = 'range';
    startInput.id = id + 'Start';
    startInput.name = id;
    startInput.min = min;
    startInput.max = defaultValues[1]; // Max is the current end value
    startInput.step = step;
    startInput.value = defaultValues[0];
    startInput.addEventListener('input', handleRangeInputChange);

    // End Range Input
    const endInput = document.createElement('input');
    endInput.type = 'range';
    endInput.id = id + 'End';
    endInput.name = id;
    endInput.min = defaultValues[0]; // Min is the current start value
    endInput.max = max;
    endInput.step = step;
    endInput.value = defaultValues[1];
    endInput.addEventListener('input', handleRangeInputChange);

    container.appendChild(label);
    container.appendChild(startInput);
    container.appendChild(endInput);
}

function handleRangeInputChange(event) {
    const target = event.target;
    const id = target.name;
    const start = document.getElementById(id + 'Start');
    const end = document.getElementById(id + 'End');

    if (target === start) {
        end.min = start.value; // Adjust the min of the end input
    } else {
        start.max = end.value; // Adjust the max of the start input
    }

    appState[id] = [parseFloat(start.value), parseFloat(end.value)];
    updatePlots();
}

function handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'range' ? parseFloat(target.value) : target.value;
    const name = target.name;

    appState[name] = value;
    updatePlots();
}

function calculateMortgage(principal, annualInterestRate, years = 30) {
    const monthlyInterestRate = annualInterestRate / 12;
    const numPayments = years * 12;
    return principal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numPayments)) / (Math.pow(1 + monthlyInterestRate, numPayments) - 1);
}

function getRandomValueFromRange(min, max) {
    return Math.random() * (max - min) + min;
}

function calculateIRR(cashFlows) {
    let guess = 0.01;
    const maxIterations = 1000;
    const accuracy = 0.000001;
    for (let i = 0; i < maxIterations; i++) {
        let npv = 0;
        for (let j = 0; j < cashFlows.length; j++) {
            npv += cashFlows[j] / Math.pow(1 + guess, j);
        }
        if (Math.abs(npv) < accuracy) {
            return guess;
        }
        guess += npv > 0 ? accuracy : -accuracy;
    }
    return null;
}

function runSimulationsWithSavingsCheck() {
    let results = [];

    const purchasePrices = range(1000000, 4100000, 100000);
    purchasePrices.forEach(purchasePrice => {
        let favorableOutcomes = 0;
        let irrs = [];
        let countIrrAboveTarget = 0;

        for (let i = 0; i < 1000; i++) {
            const income = getRandomValueFromRange(appState.annualBaseIncome[0], appState.annualBaseIncome[1]);
            const expense = getRandomValueFromRange(appState.annualBaseExpense[0], appState.annualBaseExpense[1]);
            const interestRate = getRandomValueFromRange(appState.interestRate[0], appState.interestRate[1]);
            const closingCostPercentage = getRandomValueFromRange(appState.closingCostPercentage[0], appState.closingCostPercentage[1]);
            const additionalUpfrontCosts = getRandomValueFromRange(appState.additionalUpfrontCosts[0], appState.additionalUpfrontCosts[1]);
            const additionalAnnualIncome = getRandomValueFromRange(appState.additionalAnnualIncome[0], appState.additionalAnnualIncome[1]);
            const additionalAnnualCosts = getRandomValueFromRange(appState.additionalAnnualCosts[0], appState.additionalAnnualCosts[1]);
            const propertyGrowthRate = getRandomValueFromRange(appState.propertyGrowthRate[0], appState.propertyGrowthRate[1]);
            const inflationRate = getRandomValueFromRange(appState.inflationRate[0], appState.inflationRate[1]);

            const downPayment = purchasePrice * appState.downPaymentPercentage;
            const loanAmount = purchasePrice - downPayment;
            const closingCosts = loanAmount * closingCostPercentage;
            const initialOutlay = downPayment + closingCosts + additionalUpfrontCosts;

            if (appState.savingsAmount < initialOutlay) continue;

            let cashFlows = [-initialOutlay];
            let debt = 0;
            const monthlyMortgage = calculateMortgage(loanAmount, interestRate);
            const annualMortgagePayment = monthlyMortgage * 12;

            for (let year = 1; year <= appState.years; year++) {
                let adjustedIncome = income * Math.pow(1 + inflationRate, year);
                let adjustedExpense = expense * Math.pow(1 + inflationRate, year);
                let adjustedAdditionalIncome = additionalAnnualIncome * Math.pow(1 + inflationRate, year);
                let adjustedAdditionalCosts = additionalAnnualCosts * Math.pow(1 + inflationRate, year);

                let annualCashFlow = adjustedIncome + adjustedAdditionalIncome - adjustedExpense - annualMortgagePayment - adjustedAdditionalCosts;

                if (annualCashFlow < 0) {
                    debt += Math.abs(annualCashFlow);
                    debt *= 1.10; // Applying 10% interest on the debt
                } else {
                    if (annualCashFlow > debt) {
                        annualCashFlow -= debt;
                        debt = 0;
                    } else {
                        debt -= annualCashFlow;
                        annualCashFlow = 0;
                    }
                }

                cashFlows.push(annualCashFlow);
            }

            const grossSalePrice = purchasePrice * Math.pow(1 + propertyGrowthRate, appState.years);
            const saleClosingCosts = grossSalePrice * 0.06;
            const finalSalePrice = grossSalePrice - saleClosingCosts;
            cashFlows[appState.years] += finalSalePrice;

            const irr = calculateIRR(cashFlows);
            if (irr !== null && !isNaN(irr)) {
                irrs.push(irr);
                if (irr > appState.targetIRR) {
                    countIrrAboveTarget++;
                }
            }

            if (annualCashFlow >= 0) {
                favorableOutcomes++;
            }
        }

        const favorablePercentage = (favorableOutcomes / 1000) * 100;
        const averageIRR = irrs.length > 0 ? average(irrs) : null;
        const percentAboveTargetIRR = irrs.length > 0 ? (countIrrAboveTarget / irrs.length) * 100 : 0;

        results.push({ purchasePrice, favorablePercentage, averageIRR, percentAboveTargetIRR });
    });

    return {
        purchasePrices: purchasePrices,
        favorablePercentages: results.map(r => r.favorablePercentage),
        averageIRRs: results.map(r => r.averageIRR),
        percentAboveTargetIRRs: results.map(r => r.percentAboveTargetIRR)
    };
}

function getRandomValueFromRange(min, max) {
    return Math.random() * (max - min) + min;
}

function calculateMortgage(principal, annualInterestRate) {
    const monthlyInterestRate = annualInterestRate / 12;
    const numPayments = appState.years * 12;
    return principal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numPayments)) / (Math.pow(1 + monthlyInterestRate, numPayments) - 1);
}

function average(array) {
    return array.reduce((a, b) => a + b) / array.length;
}

function range(start, stop, step) {
    return Array.from({ length: (stop - start) / step + 1}, (_, i) => start + (i * step));
}
function handleInputChange(event) {
    const target = event.target;
    // Parsing the value as float for numerical inputs
    const value = (target.type === 'range') ? parseFloat(target.value) : target.value;
    const name = target.name;

    // Update appState and trigger plot update
    appState[name] = value;
    updatePlots();
}

function handleRangeInputChange(event) {
    const target = event.target;
    const id = target.name;
    const startInput = document.getElementById(id + 'Start');
    const endInput = document.getElementById(id + 'End');

    // Update the range limits for the start and end inputs
    if (target === startInput) {
        endInput.min = startInput.value;
    } else {
        startInput.max = endInput.value;
    }

    // Update appState and trigger plot update
    appState[id] = [parseFloat(startInput.value), parseFloat(endInput.value)];
    updatePlots();
}

// updatePlots function needs to be defined or updated based on how you want to process the data and update the charts.
// Inside the updatePlots function
function updatePlots() {
    const results = runSimulationsWithSavingsCheck();

    // Prepare data for Chart.js
    const favorableData = {
        labels: results.purchasePrices,
        datasets: [{
            label: 'Favorable Outcomes (%)',
            data: results.favorablePercentages,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
        }]
    };

    const irrData = {
        labels: results.purchasePrices,
        datasets: [{
            label: 'Internal Rate of Return (IRR) (%)',
            data: results.averageIRRs,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
        }]
    };

    // Rendering the charts
    renderChart('favorablePlot', favorableData);
    renderChart('irrPlot', irrData);
}

function renderChart(canvasId, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// On DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    createInputElements();
    updatePlots(); // Run initial simulations and render plots
});
    const irrData = {
        labels: results.purchasePrices,
        datasets: [{ /* ... dataset for IRR */ }]
    };

    renderPlot('favorablePlot', favorableData, { /* ... options */ });
    renderPlot('irrPlot', irrData, { /* ... options */ });
}

function range(start, stop, step) {
    return Array.from({ length: (stop - start) / step + 1}, (_, i) => start + (i * step));
}

document.addEventListener('DOMContentLoaded', function() {
    const inputs = ['savingsAmount', 'interestRate', 'downPaymentPercentage', 'closingCostPercentage', 'additionalUpfrontCosts', 'annualBaseIncome', 'annualBaseExpense', 'additionalAnnualIncome', 'additionalAnnualCosts', 'propertyGrowthRate', 'inflationRate', 'years', 'targetIRR'];
    inputs.forEach(inputId => {
        document.getElementById(inputId).addEventListener('input', handleInputChange);
    });

document.addEventListener('DOMContentLoaded', function() {
    createInputElements();
    updatePlots();
});
