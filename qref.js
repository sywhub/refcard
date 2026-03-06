/*
 * Quick Reference Displaying
 */
class QReference extends BidSystem{
    UIClass = 'QRefUI';

    constructor(displayId) {
        super()
        var e = document.getElementById(displayId);
        clearContents(e);
        this.disp = document.createElement('div');
        this.disp.setAttribute('id', 'QRefDisplay');
        this.disp.setAttribute('class', 'QRefDisplay');

        this.Title = `${trEnZh('Quick Reference')}`;
        createIfNeeded(e, 'h2', 'QRefTitle', this.Title);
        var ctrl = createIfNeeded(e, 'div', 'QRefControl');

        e.appendChild(this.disp);
    }

    // workhorse
    run(seq) {
        clearContents(this.disp);
        this.breadCrumb(seq);
        this.bidChoices(seq);
    }

    // Those bids leading to here
    breadCrumb(seq) {
        let span = document.createElement('span');
        span.setAttribute('id', 'QRefBidSeq');
        span.setAttribute('class', 'Zero');
        this.disp.appendChild(span);
        let seqS = this.seqString(seq);
        // Special case for opening bids
        if (seqS == "")
            span.innerHTML = trEnZh('Open');
        else {
            // If competitive/responsive bids were coded in the system
            span.innerHTML = `${trEnZh('Previous Bid')}: `;
            let last = seq.at(-1);
            let prevSeq;
            if (last == '-')
                prevSeq = seq.slice(0, seq.length - 2)
            else
                prevSeq = seq.slice(0, seq.length - 1)
            // Setup the link to be clickable
            let link = document.createElement('a');
            link.setAttribute('href', '#');
            link.addEventListener('click', (e) => {this.run(prevSeq);});
            link.innerHTML = seqS;
            span.appendChild(link);
        }
    }

    // List the bids coded under this situation
    bidChoices(seq) {
        var k = seqKey(seq) // guaranteed to exist
        // recreate the div everytime
        var e = document.createElement('div');
        e.setAttribute('id', 'QRefBidList');
        e.setAttribute('class', 'QRefBidList');
        this.disp.appendChild(e);
        // Grid headers
        var row = 1;
        var hdrChoice = gridElement(e, trEnZh("Bid Choices"), 1, row++);
        hdrChoice.style['grid-column-end'] = 4;
        hdrChoice.style['justify-self'] = 'center';
        hdrChoice.setAttribute('class', "BidHeader");
        hdrChoice.setAttribute('id', "BidChoices");

        var bids = Config.WorkingSet.Rules[k];
        // Two local functions
        var linkFunc = (pDiv, s, col, html) => {
            let refKey = seqKey(s);
            let elem = gridElement(pDiv, '', col, row);
            if (Config.WorkingSet.Rules[refKey] != undefined) {
                let link = document.createElement('a');
                link.setAttribute('href', '#');
                link.addEventListener('click', (e) => {this.run(s);});
                link.innerHTML = trEnZh(html);
                elem.appendChild(link);
            } else
                elem.innerHTML = '&nbsp;'
        };
        var forceFlag = (rowDiv, row, c, flag, txt, elem) => {
            if ('Meta' in c && c.Meta[flag]) {
                if (txt == '')
                    txt = trEnZh(c.Meta[flag]);
                if (elem == null) {
                    elem = gridElement(rowDiv, trEnZh(txt), 5, row);
                    elem.setAttribute('class', 'BidFlags');
                } else
                    elem.insertAdjacentHTML('beforeend', `, ${trEnZh(txt)}`);
            }
            return elem;
        };

        // Process each bid
        for (let c of bids.Bids) {
            // Package all row info into a container div
            let rowDiv = document.createElement('div');
            rowDiv.style['display'] = 'contents';
            rowDiv.setAttribute('class', `GridList${row%2}`);
            gridElement(rowDiv, this.htmlBid(c.Bid), 1, row);
            gridElement(rowDiv, this.criteriaString(c.Criteria[0], c.Bid), 2, row);
            let flagElem = null;
            for (const f of [['Convention', ''], ['Forcing', '1RF'], ['GF', 'GF'], ['Notes', '']])
                flagElem = forceFlag(rowDiv, row, c.Criteria[0], f[0], f[1], flagElem);
            if (flagElem == null)
                gridElement(rowDiv, '&nbsp;', 5, row);
            e.appendChild(rowDiv);
            // Link up  follow-ups
            linkFunc(rowDiv, [...seq, c.Bid], 3, "Compete")
            linkFunc(rowDiv, [...seq, c.Bid, '-'], 4, "Reply")
            // Do we have more than one criteria for this bid?
            for (let i = 1; i < c.Criteria.length; ++i) {
                ++row;
                rowDiv = document.createElement('div');
                gridElement(rowDiv, '&nbsp;', 1, row);
                rowDiv.style['display'] = 'contents';
                rowDiv.setAttribute('class', `GridList${row%2}`);
                gridElement(rowDiv, this.criteriaString(c.Criteria[i], c.Bid), 2, row);
                gridElement(rowDiv, '&nbsp;', 3, row);
                gridElement(rowDiv, '&nbsp;', 4, row);
                flagElem = null;
                flagElem = forceFlag(rowDiv, row, c.Criteria[i], 'Convention', '', flagElem);
                flagElem = forceFlag(rowDiv, row, c.Criteria[i], 'Forcing', '1RF', flagElem);
                flagElem = forceFlag(rowDiv, row, c.Criteria[i], 'GF', 'GF', flagElem);
                if (flagElem == null)
                    gridElement(rowDiv, '&nbsp;', 5, row);
                e.appendChild(rowDiv);
            }
            
            // Display flags and convention
            e.appendChild(rowDiv);
            row++;  // onward
        }
    } 
}

// Onclick function
function QRef3(displayId) {
    var qref = new QReference(displayId);
    if (Config.WorkingSet == undefined || Config.WorkingSet == null) {
        Config.getDefaults();
        Config.makeBidRules();
    }
    qref.run([])
}
