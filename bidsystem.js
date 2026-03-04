class BidSystem {
    constructor() {
    }

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

    // Turn bid into pretty HTML code
    htmlBid(txtBid) {
        if (txtBid == "X" || txtBid == "XX" || txtBid == '-')
            return txtBid;
        return txtBid[0]+Card.ltr2html(txtBid.slice(1));
    }
}