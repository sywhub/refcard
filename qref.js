class QReference {
    UIClass = 'QRefUI';
    constructor(displayId) {
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

    run(seq) {
        clearContents(this.disp);
        this.breadCrumb(seq);
        this.bidChoices(seq);
    }

    breadCrumb(seq) {
        let span = document.createElement('span');
        span.setAttribute('id', 'QRefBidSeq');
        span.setAttribute('class', 'Zero');
        this.disp.appendChild(span);
        let seqS = this.seqString(seq);
        if (seqS == "")
            span.innerHTML = trEnZh('Open');
        else {
            span.innerHTML = `${trEnZh('Previous Bid')}: `;
            let last = seq.at(-1);
            let prevSeq;
            if (last == '-')
                prevSeq = seq.slice(0, seq.length - 2)
            else
                prevSeq = seq.slice(0, seq.length - 1)
            let link = document.createElement('a');
            link.setAttribute('href', '#');
            link.addEventListener('click', (e) => {this.run(prevSeq);});
            link.innerHTML = seqS;
            span.appendChild(link);
        }
    }

    bidChoices(seq) {
        var k = seqKey(seq)
        var e = document.createElement('div');
        e.setAttribute('id', 'QRefBidList');
        e.setAttribute('class', 'QRefBidList');
        this.disp.appendChild(e);
        // Grid headers
        var hdrChoice = gridElement(e, trEnZh("Bid Choices"), 1, 1);
        hdrChoice.style['grid-column-end'] = 4;
        hdrChoice.style['justify-self'] = 'center';
        hdrChoice.setAttribute('class', "BidHeader");
        hdrChoice.setAttribute('id', "BidChoices");

        var bids = Config.WorkingSet.BidRules[k];
        var row = 2;
        var linkFunc = (pDiv, s, col, html) => {
            let refKey = seqKey(s);
            if (Config.WorkingSet.BidRules[refKey] != undefined) {
                let elem = gridElement(pDiv, '', col, row);
                let link = document.createElement('a');
                link.setAttribute('href', '#');
                link.addEventListener('click', (e) => {this.run(s);});
                link.innerHTML = trEnZh(html);
                elem.appendChild(link);
            }
        };
        var forceFlag = (rowDiv, row, c, flag, txt, elem) => {
            if (c[flag])
                if (elem == null) {
                    elem = gridElement(rowDiv, trEnZh(txt), 5, row);
                    elem.setAttribute('class', 'BidFlags');
                } else
                    elem.insertAdjacentHTML('beforeend', `, ${trEnZh(txt)}`);
            return elem;
        };
        for (let c of bids.Bids) {
            let rowDiv = document.createElement('div');
            rowDiv.style['display'] = 'contents';
            rowDiv.setAttribute('class', 'GridList');
            gridElement(rowDiv, this.htmlBid(c.Bid), 1, row);
            gridElement(rowDiv, this.criteriaString(c.Criteria[0], c.Bid), 2, row);
            e.appendChild(rowDiv);
            for (let i = 1; i < c.Criteria.length; ++i) {
                rowDiv = document.createElement('div');
                rowDiv.style['display'] = 'contents';
                rowDiv.setAttribute('class', 'GridList');
                gridElement(rowDiv, this.criteriaString(c.Criteria[i], c.Bid), 2, ++row);
                e.appendChild(rowDiv);
            }
            linkFunc(rowDiv, [...seq, c.Bid], 3, "Compete")
            linkFunc(rowDiv, [...seq, c.Bid, '-'], 4, "Reply")
            let flagElem = null;
            flagElem = forceFlag(rowDiv, row, c, 'Convention', c.Convention, flagElem);
            flagElem = forceFlag(rowDiv, row, c, 'Forcing', '1RF', flagElem);
            flagElem = forceFlag(rowDiv, row, c, 'GF', 'GF', flagElem);
            e.appendChild(rowDiv);
            row++;
        }
    } 

    seqString(sequence) { 
        var seqStr = "";
        var opponent = sequence.length % 2;
        for (const s of sequence) {
            let str = this.htmlBid(s);
            if (opponent == 1) {
                if (str != '-')
                    str = '[' + str + ']';
                seqStr += '<span class="OpponentBid"> ' + str + '</span>';
            } else
                seqStr += ' ' + str;
            opponent = 1 - opponent;
        }       
        return seqStr;
    } 

    htmlBid(txtBid) {
        if (txtBid == "X" || txtBid == "XX" || txtBid == '-')
            return txtBid;
        return txtBid[0]+Card.ltr2html(txtBid.slice(1));
    }

    /* 
     * SuitLen syntax is probably too complicated
     * For now:
     * SuitLen: <simple descriptor> | SuitChar <simple descriptor> | object
     * simple descriptor = num | array of 2 numbers
     * SuitChar: one of S, H, D, C
     * num = lower limit (inclusive)
     * array of 2 numbers = [lower, higher) // thinking of retiring this
     * object = Suit : <simple descriptor> [, object]
     */
    suitLenString(k, v, bid) {
        var retString = "";
        if (Array.isArray(v)) {
            if (v[0] == 0)
                retString += v[1] + '-';
            else if (Number(v[0]) == Number(v[1]))
                retString += v[0];
            else
                retString += v[0] + '~' + v[1];
            retString += Card.ltr2html(bid.slice(1));
        } else if (typeof(v) == 'object') {
            for (const [sKey, sVal] of Object.entries(v)) {
                if (Array.isArray(sVal)) {
                    if (sVal[0] == 0)
                        retString += sVal[1] + '-';
                    else if (Number(sVal[0]) == Number(sVal[1]))
                        retString += sVal[0];
                    else
                        retString += sVal[0] + '~' + sVal[1];
                } else
                    retString += sVal + '+';
                retString += Card.ltr2html(sKey);
                retString += ' and ';
            }
            retString = retString.slice(0, -5);
        } else {
            retString += v + '+' + Card.ltr2html(bid.slice(1));
        }

                
        return retString;
    }

    /*
     * AnySuit is an object of [SuitChar Num] pairs
     */
    anySuitString(k, v, dummy) {
        var str = "Any of ";
        for (const [sKey, sVal] of Object.entries(v)) {
            str += sVal + '+';
            str += Card.ltr2html(sKey);
            str += ' '
        }
        return str.trim();
    }
    honorsString(k, v, bid) {
        var s = this.suitLenString(k, v, bid);
        return s + ' Honors';
    }

    criteriaString(c, bid) {
        var dispatchTbl = {
            'SuitLen': this.suitLenString,
            'AnySuit': this.anySuitString,
            'Honors': this.honorsString,
        }
        var retString = "";
        var tmpString = "";
        var comma = false;
        for (const [k, v] of Object.entries(c)) {
            if (k in dispatchTbl) {
                if (comma) {retString += ", "}
                comma = true;
                retString += dispatchTbl[k].bind(this, k, v, bid)();
            } else {
                if (comma) {retString += ", "}
                comma = true;
                switch (k) {
                case 'HCP':
                case 'LTC':
                case 'TP':
                    if (Array.isArray(v)) {
                        if (v[0] == 0)
                            retString += v[1]+'- '+trEnZh(k);
                        else if (v[0] == v[1])
                            retString += v[0]+' '+trEnZh(k);
                        else
                            retString += v[0]+'~'+v[1]+' '+trEnZh(k);
                    } else
                        retString += v+'+'+trEnZh(k);
                    break;
                case 'Seat':
                    retString += trEnZh("At " + v[0] + ' or ' + v[1] + ' Seat');
                    break;
                case 'Shape':
                    if (v == "Balanced")
                        retString += " " + trEnZh(v);
                    else
                        retString += " " + trEnZh(v + " or better");
                    break;
                case 'SingleVoid':
                    retString += trEnZh("Singleton or Void");
                    break;
                case 'Control':
                    if (typeof(v) == 'string')
                        retString += Card.ltr2html(v) + ' '+trEnZh('have ' + k);
                    else if (typeof(v) == 'boolean')
                        retString += trEnZh(k);
                    break;
                case 'KingSuit':
                    retString += trEnZh("Have")+" " + Card.ltr2html(v) + "K" ;
                    break;
                case 'NoStopper':
                case 'Stopper':
                    if (Array.isArray(v)) {
                    for (let i = 0; i < v.length - 1; ++i)
                        retString+=Card.ltr2html(v[i])+' and ';
                    retString+=Card.ltr2html(v[v.length -1]);
                    } else
                    retString += Card.ltr2html(v);
                    if (k == 'Stopper')
                        retString+= " "+trEnZh("Stopper");
                    else if (k == 'NoStopper')
                        retString += " " + trEnZh("No Stopper");
                    break;
                case 'TrumpQ':
                    tmpString = "";
                    if (v)
                        tmpString = 'Have';
                    else
                        tmpString = 'No';
                    retString += trEnZh(tmpString + " "+ "Trump Queen");
                    break;
                case 'KeyCard':
                case 'AceCount':
                case 'KingCount':
                    tmpString = "";
                    if (Array.isArray(v))
                        tmpString = "Have"+" " + v[0] + ' or ' + v[1];
                    else
                        tmpString = "Have"+" " + v;
                    if (k == 'AceCount' || k == 'KingCount')
                        tmpString += ' ' + k.slice(0,-5);
                    else
                        tmpString += ' ' + k;
                    retString += trEnZh(tmpString);
                    break;
                case 'SideKing':
                    retString += v ? trEnZh('Have Side King(s)') : trEnZh('No Side King');
                    break;
                default:
                    retString += '"' + k + '": "' + v + '"';
                    break;
                }
            }
        }
        return retString;
    }
}

function QRef3(displayId) {
    var qref = new QReference(displayId);
    if (Config.WorkingSet == undefined || Config.WorkingSet == null) {
        Config.init(displayId);
        Config.getDefaults();
        Config.makeBidRules();
    }
    qref.run([])
}