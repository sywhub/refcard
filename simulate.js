class SimStat extends BidSystem {
    constructor(menuId) {
        super()
        this.makeMenu(menuId);
        this.initDisplay()
    }

    makeMenu(menuId) {
        const e = document.getElementById(menuId);
        const SecenarioList = ['1x', '1NT', '2C', 'Preempt'];
        this.makeSelect(e, 'Scenario: ', 'Scenario', SecenarioList);
    }

    initDisplay() {
        var e = document.getElementById('ListDisplay');
        this.disp = document.createElement('div');
        this.disp.setAttribute('id', 'SimStat');
        this.disp.setAttribute('class', 'SimStat');
        e.appendChild(this.disp);
    }

    makeSelect(parentDiv, lTxt, selId, optitems) {
        this.scenario = document.getElementById(selId);
        if (this.scenario == null) {
            var l = document.createElement('label');
            l.setAttribute('class', 'SelectLable');
            l.innerHTML = lTxt;
            l.setAttribute('for', selId)
            parentDiv.appendChild(l)
            this.scenario = document.createElement('select');
            this.scenario.setAttribute('id', selId);
            parentDiv.appendChild(this.scenario);
            optitems.forEach(s => {
                let opt = document.createElement('option');
                if (s == '-') {
                    opt.setAttribute('disabled', '');
                    opt.setAttribute('value', '');
                    opt.innerHTML = '&#x2500;'.repeat(4);
                } else {
                    opt.setAttribute('value', s);
                    opt.innerHTML = s;
                }
                this.scenario.appendChild(opt);
            });
        }
    }
}

function Simulate(e) {
    var e = document.getElementById('SimStat');
    clearContents(e)
    var scenario = simModule.scenario.value;
    e.insertAdjacentHTML('beforeend', `Simulate: ${scenario}<br>`);
}

function RunStat(e) {
    var e = document.getElementById('SimStat');
    clearContents(e)
    var scenario = simModule.scenario.value;
    e.insertAdjacentHTML('beforeend', `Run Statistics: ${scenario}<br>`);
}