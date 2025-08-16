/*
 * Collections of miscellaneous tools
 * Sin-Yaw Wang, 2024
 */


// remove all children of an element
function clearContents(delement) {
    if (delement != null)
        while (delement.hasChildNodes())
            delement.removeChild(delement.firstChild);
}

// Put a footer near the bottom
// Need a CSS item first
function showFooter(suits, footerDate) {
    var d = document.getElementById('footer');
    if (d == null) {
        d = document.createElement('div');
        d.setAttribute('id', 'footer');
        d.setAttribute('name', 'footer');
        d.setAttribute('class', 'Footer');
        document.body.appendChild(d);
    }
    var author = trEnZh(document.querySelector('meta[name="author"]').content);
    var datestring = footerDate.toLocaleDateString(Config.Language, {month: "short", year: "numeric", day: "numeric"});
    author += ", " + datestring;
    var htmlString = suits + '<span style="font-style: italic; font-size: small;">&nbsp;' + author + "</span>";
    d.innerHTML = htmlString;
}

function gridElement(par, s, c, r) {
    let gr = document.createElement('div');
    gr.style['grid-column-start'] = c;
    gr.style['grid-row-start'] = r;
    gr.innerHTML = s;
    par.appendChild(gr);
    return gr;
}

function setElementID(elem, id) {
    elem.setAttribute('id', id);
    elem.setAttribute('class', id);
}



// Stringify a possible array of numbers or just a number
// Accept nested arrays of numbers
function rangeStr(v) {
    if (typeof(v) == 'number')
        return v;
    if (Array.isArray(v)) {
        if (v.length == 1 && typeof(v[0])=='number')
            return v[0];

        let s = []
        for (let i = 0; i < v.length; i++)
            s.push(this.rangeStr(v[i]))
        return s;
    }
}

function createIfNeeded(p, elemType, id, html="", cls='') {
    var e = document.getElementById(id);
    if (e == null) {
        e = document.createElement(elemType);
        setElementID(e, id);
        if (cls != '')
            e.setAttribute('class', cls)
        if (html != "")
            e.innerHTML = html;
        p.appendChild(e);
    }
    return e;
}


function compSequence(seq1, seq2) {
    if (seq1 == undefined || seq2 == undefined || 
        !Array.isArray(seq1) || !Array.isArray(seq2))
        return false;

    var result = seq1.length == seq2.length;
    for (let i = 0; i < seq1.length && result; ++i)
        result = seq1[i] == seq2[i];
    return result;
}

function DownLoadToFile(fname, elemID, description="") {
    var e = document.getElementById(elemID);
    if (e == null)
        return;

    const a = document.createElement('a');
    const file = new Blob([e.innerText], { type: 'text/plain' });
    a.href = URL.createObjectURL(file);
    a.download = fname;
    a.click();
    URL.revokeObjectURL(a.href);
}

function timeString() {
    const tNow = new Date();
    const dateString = tNow.toLocaleDateString("en-US", {month: "short", year: "numeric", day: "numeric"}) 
    const timeString = tNow.toLocaleTimeString();
    let tString = '"Generated": "' + dateString + '", ';
    tString += '"Generate Time": "' + timeString + '",<br>';
    return tString;
}

function trEnZh(s) {
    var langIdx = Config.OptionItems.Language.Value;
    if (Config.OptionItems.Language.IDs[langIdx] == 'zh-TW' && s in enzh)
        return enzh[s];

    if (!(s in enzh))
        enzh[s] = s;
    return s;
}
