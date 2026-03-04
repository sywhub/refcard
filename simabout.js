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
}