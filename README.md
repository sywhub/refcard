# SAYC Bidding Quick Reference Card
This is a quick reference card for beginner and intermedium bridge players to learn and practice Standard American Yellow Card bidding
systems.  The software is slightly configurable to accomodate certain convention selections. Theoretically, it can also do other systems, but
that requires someone to author them.

To install, save all files in a directory and point your browser to the "index.html" file at that directory.  If you saved these files
locally, use the "open file" feature of your browser.  If you saved them at a cloud storage or some server, consult your technical experts.

# Usage
The program displays the currently available bids according to the
configured bidding systems.  Each bid shows the criteria the hand must
satisfy to make the bid.  The player should choose among those bids or just
pass if his/her hand does not meet any of them.  If the hand satisfies
multiple bids, the player should exercise his/her own judgement.  Generally
speaking, pick the one with the strictest criteria.

Near the top shows the bidding sequence leading to this point.  The bids in
square brackets ([]) are what were bid by the opponents.  If there's
nothing, the page shows the options to open bid.

To see the available options to reply to one specific bid, click "Reply" on
the line, if displayed.  If there's no "Reply" link to click, the replies
are to be done "naturally."

To see the available options to compete, one the chosen bid has been made,
click the "Compete" link if displayed.  The lack of the link also means the
choices are natural.

The abbreviations are explained in the "About" page.  To adopt, or not,
certain conventions, go to the Setting page.  Change language to Chinese or
English also at the Setting page.

Click "Compete" as if the bid of the line has just been called and you are
the next to bid.  Click "Reply" if you are the partner and your RHO passed.

For example, if you sit North and are the dealer.  Consult the opening page
and choose a bid.  If you are East, click the "Compete" link to see which
bids are available to you.  But if you are South and if East passed, click
the "Reply" link. If, however, East chose to interfere, South should click
the "Compete" link to display the options East could have chosen, then
click the "Compete" of that page to see which options South has.

A more concrete example, North, after consulting the opening page, chose to
bid 1S.  East clicked "Compete" to see his options and chose to bid "X"
(Double).  South, at this moment, should follow the bid sequence and click
the "Compete" link at the "1S" line, then the "Compete" link at the "X"
line to see his option.  However, if South chose to pass, then West should
have also followed the sequence above and click the "Reply" link on that
"X" line.

The "Compete" link is for South to compete with East.  The "Reply" link is
for West to reply to East, if South passed.

If there is no link following the bid line, this means you are to bid "naturally" to compete or reply.

If you hand does not meet any of the criteria on the page, you are supposed to pass.  Occassionally, you see a bid of "-" (dash), that
describes the criteria to bid "pass."  It is rarely used.

To read about the convention, try the About page.  At its bottom, there are links to selected few.

# Simulator and Statitical Analyser
From the same diretory, "simulator.html" launches the secondary "experimental" package to simulate boards with the dual purpose of generating practices or analyzing the validity of a bid design.  This is probably best done by AI, instead of human coding.  As such, this package is quite experimental.

The "Simulate" and "Statistics" buttons work from the drop-down menu for the perspective "scenario". The code was "fixed" for those and require manual coding to add/modify.  The "Download" button save either the BBO LIN entries or the generated hand into a local file for ease of sharing.

The "Settings" is identical to the quick reference, but they don't share the same settings.

# To author a new bidding system
I cannot fathom anyone authoring a brand new bidding system in this modern days of bridge. The most logical thing to do is to enhance or augment an existing one.

## SAYC modifications
If the new system is based on SAYC, proceed to edit/add new data files in the data directory.  If new files are added, you must edit "index.html" to include it.

Most likely scenario is adding conventions.  Follow "lebensohl.data" and create a new file.  Decide whether this convention is "always on" or an option.
## Brand New Sysstem
Begin with a data file for openings.  Replace "base.data" (or create a new file).  Change index.html to remove all data files and add your own "base".
A System is made up with "Components".  Each can be "built-in" or optional.  Each component has a set of meta properties and a set of "bidding rules".  A bidding rule specifies the bid choices given a bidding sequence.  Imagine in an auction and it is your turn to bid, that rule list your possible choices with each choice one or more "criteria" that your hand must satisfy.

Each "bid" has a set (more than one) criteria and an optional meta properties: whether it is forcing, the name of the convention, etc.  Each criteria is a list of "key-value" pairs in a strict format.  It is relatively tedious to hand-create all the bidding rules for all the bid sequences.  You are better off generating those rules programmatically.

Remember a bidding system is alive.  It grows and changes over time.  Whatever you do to create a new system, plan for many future modifications.
