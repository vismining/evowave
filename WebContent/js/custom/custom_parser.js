//http://dados.gov.br/dataset/25166-quantidade-de-outras-transacoes-financeiras-por-canal-nao-presencial
var source_1 = JSON.parse('[{"data":"01/01/2010","valor":"4057"},{"data":"01/01/2011","valor":"4490"},{"data":"01/01/2012","valor":"4878"},{"data":"01/01/2013","valor":"4949"},{"data":"01/01/2014","valor":"5197"},{"data":"01/01/2015","valor":"5226"}]');

//http://dados.gov.br/dataset/25158-quantidade-de-consultas-de-extrato-saldo-por-canal-presencial
var source_2 = JSON.parse('[{"data":"01/01/2005","valor":"41"},{"data":"01/01/2006","valor":"43"},{"data":"01/01/2007","valor":"46"},{"data":"01/01/2008","valor":"48"},{"data":"01/01/2009","valor":"50"},{"data":"01/01/2010","valor":"53"},{"data":"01/01/2011","valor":"55"},{"data":"01/01/2012","valor":"57"},{"data":"01/01/2013","valor":"59"},{"data":"01/01/2014","valor":"61"},{"data":"01/01/2015","valor":"63"},{"data":"01/01/2016","valor":"64"}]');

//Adapto os elementos da base 1
source_1.forEach(element => {
    element.year = parseInt(element.data.substring(6));
    element.qtd_outran = parseFloat(element.valor);
});

//Adapto os elementos da base 2
source_2.forEach(element => {
    element.year = parseInt(element.data.substring(6));
    element.qtd_salext = parseFloat(element.valor);
});

//Filtro entre elementos com ano par/ímpar
source_1 = {
    pares: source_1.filter(element => element.year % 2 === 0),
    impares: source_1.filter(element => element.year % 2 !== 0),
}

source_2 = {
    pares: source_2.filter(element => element.year % 2 === 0),
    impares: source_2.filter(element => element.year % 2 !== 0),
}

var source = {pares: [], impares: []};

/*
    RESTRIÇÕES
        - As bases devem ter uma quantidade par de anos
        - As bases devem ter a mesma quantidade de elementos
        - As bases devem considerar os mesmos anos
*/

let colors = [
    'FFFF0000',
    'FF00FF00'
];

for(let i = 0; i < source_1.pares.length; i++) {
    source.pares.push({
        color: colors[0],
        data: {
            qtd_outran: source_1.pares[i].qtd_outran,
            qtd_salext: source_2.pares[i].qtd_salext
        }
    });
}

for(let i = 0; i < source_1.impares.length; i++) {
    source.impares.push({
        color: colors[1],
        data: {
            qtd_outran: source_1.impares[i].qtd_outran,
            qtd_salext: source_2.impares[i].qtd_salext
        }
    });
}

delete source_1;
delete source_2;

//Calculando Porcentagens
let total = source.pares.length + source.impares.length;
let pares = source.pares.length;
let impares = source.impares.length;

pares = ((pares * 100) / total);
impares = ((impares * 100) / total)/100;

//Criando Sources
let dataset_pares = source.pares.map((element, index) => {
    return {
        position: index + 1,
        molecules: [element]
    }
});

let dataset_impares = source.impares.map((element, index) => {
    return {
        position: index + 1,
        molecules: [element]
    }
});

//Objeto Final
var data = {
    period: {
        starts: '',
        ends: ''
    },
    query: '',
    window: {
        size: 16,
        amount: 7,
        mode: 'GLOBAL'
    },
    sector: {
        label: 'Verificação de transações bancárias'
    },
    sectors: [
        {
            angle: pares,
            label: 'Anos Pares',
            windows: dataset_pares
        },
        {
            angle: impares,
            label: 'Anos Ímpares',
            windows: dataset_impares
        }
    ]
};

console.log(JSON.stringify(data));