#!/usr/bin/env python3
# Generate support DBL rules
#
# Generate rules for opener's rebid after partner's new suit and RHO's interference
# Opener opened 1-suit, LHO pass, partner replied with another suit, RHO interfered with something
# What are the rules?

class SupportDBL:
    def __init__(self):
        return

    def genRules(self):
        self.printHeaders()
        self.printRules()
        print(']});')

    def printRules(self):
        suits = ['C', 'D', 'H', 'S']
        rules = []
        for s in suits:
            sIdx = suits.index(s)   # pick a suit to open
            for res in [x for x in suits if x != s]:    # pick a new suit to reply
                resLevel = 1 if suits.index(res) > sIdx else 2
                seq = [f'1{s}', '-', f'{resLevel}{res}']    # the bidding sequence so far
                # now RHO has 2 suits to choose, plus DBL
                # First add the RHO interference bids to the rule set
                # These are relatively standard bids
                rhoChoices = [x for x in suits if x != s and x != res]
                rhoBids = [dict(Bid=f'{resLevel if suits.index(x) > suits.index(res) else resLevel + 1}{x}',
                                Criteria=[dict(HCP=10,SuitLen=5)]) for x in rhoChoices]
                rules.append(dict(Seq=seq, Bids=rhoBids))
                # then iterate opener's choices
                for rho in rhoChoices:
                    rhoLevel = resLevel if suits.index(rho) > suits.index(res) else resLevel + 1
                    rebidLevel = rhoLevel if suits.index(res) > suits.index(rho) else rhoLevel + 1
                    newSuit = [x for x in rhoChoices if x != rho][0]
                    newLevel =  rhoLevel if suits.index(newSuit) > suits.index(rho) else rhoLevel+1
                    bids = []
                    for b in ['X', f'{rebidLevel}{res}', f'{newLevel}{newSuit}', f'{rhoLevel+1}{rho}']:
                        if b == 'X':   # direct raise
                            c = dict(SuitLen={})
                            c['SuitLen'][res] = 3
                        elif b[1] == res:   # direct raise
                            c = dict(SuitLen={})
                            c['SuitLen'][res] = 4
                        elif b[1] == newSuit:
                            c = dict(SuitLen=4)
                            if suits.index(newSuit) > sIdx and newLevel >= 2:
                                c['HCP'] = 17
                                c['Meta']=dict(GF='true', Notes='Reverse')
                            elif newLevel >= 3:
                                c['Meta']=dict(GF='true')
                                c['HCP'] = 17
                            else:
                                c['Meta']=dict(Forcing='true')
                        else:   # cuebid
                            c = dict(HCP=17, Meta=dict(GF='true'))
                        bids.append(dict(Bid=b, Criteria=[c]))
                    rules.append(dict(Seq=seq + [f'{rhoLevel}{rho}'], Bids=bids))

                # Rebid after RHO DBL'ed
                xSeq = seq + ['X']
                bids = ['XX'] + [f'{(resLevel if suits.index(x) > suits.index(res) else resLevel + 1)}{x}' for x in suits if x != s]
                bids = [dict(Bid=x, Criteria=[dict(SuitLen=4 if x != 'XX' else 3)]) for x in bids]
                for b in bids:
                    if b['Bid'] == 'XX':
                        b['Criteria'][0]['SuitLen'] = {}
                        b['Criteria'][0]['SuitLen'][res] = 3
                        b['Criteria'][0]['Meta'] = dict(Notes='Support DBL')
                        break
                rules.append(dict(Seq=xSeq, Bids=bids))

        for r in rules:
            print('\t{"Seq": ',end="")
            print(r['Seq'], end=", ")
            print('"Bids": [')
            for b in r['Bids']:
                print(f'\t\t{b}',end=",\n")
            print('\t\t]},')

    def printHeaders(self):
        headers = '''BidComponents.push({ 'BuildIn': true,
        'Flag': 'SupportDBL',
        'Name': 'Support DBL',
        'Rules': ['''
        print(headers)

if __name__ == '__main__':
    sDbl = SupportDBL()
    sDbl.genRules()