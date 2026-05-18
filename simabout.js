enSimAbout = `<h3>About Bid Simulator and Statistics</h3>`;
zhSimAbout = `<h3>叫牌模擬器和統計資料</h3>`;

function AboutSimulate(d) {
    var e = document.getElementById(d);
    clearContents(e);
    var divDisp = document.createElement('div');
    divDisp.setAttribute('id', 'About');
    divDisp.setAttribute('class', 'About');
    e.appendChild(divDisp);

    var left = gridElement(divDisp, '', 1, 1);
    left.style['margin-top'] = '5vh';
    var feedback = document.createElement('a');
    feedback.setAttribute('href', 'mailto:syw.cuper+bridge@gmail.com?Subject=Feedback%20for%20Bidding%20Quick%20Reference')
    feedback.innerHTML = trEnZh('Send Feedback');
    left.appendChild(feedback);

    var right = gridElement(divDisp, '', 2, 1);
    right.innerHTML = Config.OptionItems.Language.IDs[Config.OptionItems.Language.Value] == 'en-US' ? enSimAbout : zhSimAbout;
}