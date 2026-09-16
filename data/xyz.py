#!/usr/bin/env python3
"""Generate rules for NMF, 4SF, and XYZ conventions into 3 data sets"""
from convention import Convention

# If the 1st 3 bids, without interference, are all at 1-level.  It triggers the 4th bid as XYZ.
# The key is 2C/2D being artificial.  The rest of relatively natural.
class XYZ(Convention):
    def __init__(self):
        super().__init__()
        self.meta['Convention'] = 'XYZ'

    def genRules(self):
        self.makeRules()
        self.printRules(builtIn=False)

    def makeRules(self):
        # 4 sequences that trigger XYZ
        for seq in ['CDH','CDS','CHS','DHS']:
            ruleObj = {'Bids': []}
            s = [[f"1{x}", '-'] for x in seq]
            ruleSeq = []
            for spair in s:
                ruleSeq.extend(spair)

            ruleObj = {'Seq': ruleSeq, 'Bids': []}
            for l in range(2,4):
                for s in reversed(self.suits):
                    r = f"{l}{s}"
                    ruleObj['Bids'].append({'Bid': r, 'Criteria': [{}]})
                    if r == '2C':
                        ruleObj['Bids'][-1]['Criteria'][0]['Meta'] = {'Notes': 'Relay'}
                    elif r == '2D':
                        ruleObj['Bids'][-1]['Criteria'][0]['Meta'] = {'GF': 'Yes'}
                    elif r == '3D' or r == '3H' or r == '3S':
                        if r[1] == ruleObj['Seq'][-2][1]:
                            ruleObj['Bids'][-1]['Criteria'][0]['SuitLen'] = {r[1]: 4}
                        elif r[1] == ruleObj['Seq'][0][1]:
                            ruleObj['Bids'][-1]['Criteria'][0]['SuitLen'] = {r[1]: 5}
                        else:
                            ruleObj['Bids'][-1]['Criteria'][0]['SuitLen'] = {r[1]: 6}
                        ruleObj['Bids'][-1]['Criteria'][0]['Meta'] = {'GF': 'Yes'}
                    elif r == '2H' or r == '2S' or r == '3C':
                        if r[1] == ruleObj['Seq'][-2][1]:
                            ruleObj['Bids'][-1]['Criteria'][0]['SuitLen'] = {r[1]: 4}
                        elif r[1] == ruleObj['Seq'][0][1]:
                            ruleObj['Bids'][-1]['Criteria'][0]['SuitLen'] = {r[1]: 5}
                        else:
                            ruleObj['Bids'][-1]['Criteria'][0]['SuitLen'] = {r[1]: 6}
                        ruleObj['Bids'][-1]['Criteria'][0]['Meta'] = {'Notes': 'To Play'}
                    ruleObj['Bids'][-1]['Criteria'][0]['Meta']['Convention'] = self.meta['Convention']
            ruleObj['Bids'].append(
                {'Bid': '2NT', 'Criteria': [{'Meta': {'Covention': self.meta['Convention'], 'Notes': 'Invitational'}}]})
            self.rules.append(ruleObj)
            self.rules.append({'Bids': [{'Bid': '2D', 'Criteria': [{'Meta': {'Covention': self.meta['Convention'], 'Notes': 'Puppet'}}]}],
                       'Seq': ruleSeq + ['2C', '-']})


class NMF(Convention):
    def __init__(self):
        super().__init__()
        self.meta['Convention'] = 'New Minor Forcing'

    def genRules(self):
        self.makeRules()
        self.printRules(True)

    def makeRules(self):
        for seq in ['CH','CS','DH','DS','HS']:
            ruleObj = {'Bids': []}
            s = [[f"1{x}", '-'] for x in seq]
            ruleObj['Seq'] = []
            for spair in s:
                ruleObj['Seq'].extend(spair)
            ruleObj['Seq'].extend(['1NT', '-'])
            newMinor = '2D' if ruleObj['Seq'][0] == '1C' else '2C'
            ruleObj['Bids'].append({'Bid': newMinor})
            ruleObj['Bids'][-1]['Criteria'] = [{'SuitLen': {f'{ruleObj['Seq'][2][1]}':  5}, 'HCP': [10,12]}]
            ruleObj['Bids'][-1]['Criteria'][0]['Meta'] = {'Forcing': 'Yes', 'Notes': 'Invitational', 'Convention': 'NMF'}
            self.rules.append(ruleObj)

class FSF(Convention):
    def __init__(self):
        super().__init__()
        self.meta['Convention'] = '4th Suit Forcing'

    def genRules(self):
        self.makeRules()
        self.printRules(True)

    def makeRules(self):
        commonMeta = {'Convention': '4SF', 'GF': 'Yes'}
        for o in self.suits:
            resChoices = [x for x in self.suits if x != o]
            for response in resChoices:
                rebidChoices = [x for x in self.suits if x != o and x != response]
                respondLevel = 1 + self.bidLevelInc(response, o)
                for rebid in rebidChoices:
                    rebidLevel = respondLevel + self.bidLevelInc(rebid, response)
                    ruleObj = {'Seq': [f"1{o}", '-', f"{respondLevel}{response}", '-', f"{rebidLevel}{rebid}", '-']}
                    lastOne = [x for x in self.suits if x != o and x != response and x != rebid][0]
                    lastlevel = rebidLevel + self.bidLevelInc(lastOne, rebid)
                    isReversed = self.suits.index(ruleObj['Seq'][4][1]) < self.suits.index(ruleObj['Seq'][0][1]) and int(ruleObj['Seq'][4][0]) >= 2
                    if isReversed:
                        hcp = 9
                    else:
                        hcp = 12
                        if lastlevel > 2:
                            hcp += 2
                        if lastlevel > 3:
                            hcp += 2
                    ruleObj['Bids'] = [{'Bid': f"{lastlevel}{lastOne}", 'Criteria': [{'HCP': hcp, 'Meta': commonMeta}]}]
                    self.rules.append(ruleObj)

if __name__ == "__main__":
    NMF().genRules()
    FSF().genRules()
    XYZ().genRules()