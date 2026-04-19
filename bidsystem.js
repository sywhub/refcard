class BidSystem {
    constructor() {
    }

    roundSeat(n) { return n % 4; }

    // Turn bid sequence into pretty string
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

    // Turn bid into pretty HTML code
    htmlBid(txtBid) {
        if (txtBid == "X" || txtBid == "XX" || txtBid == '-')
            return txtBid;
        return txtBid[0]+Card.ltr2html(txtBid.slice(1));
    }

    /*
     * AnySuit is an object of [SuitChar Num] pairs
     */
    anySuitString(k, v, dummy) {
        var str = trEnZh("Any of");
        for (const [sKey, sVal] of Object.entries(v)) 
            str += `  ${sVal}+${Card.ltr2html(sKey)} `;
        return str.trim();
    }

    honorsString(k, v, bid) {
        var s = this.suitLenString(k, v, bid);
        return s + ' Honors';
    }

    criteriaString(c, bid) {
        if (c === undefined || c == null || c.length <= 0)
            return '';

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
                case 'Meta':
                    comma = false;
                    break;
                default:
                    retString += '"' + k + '": "' + v + '"';
                    break;
                }
            }
        }
        retString = retString.trim();
        if (retString.at(-1) == ',')
            retString=retString.substring(0,retString.length-1);
        return retString;
    }
}

