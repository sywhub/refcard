#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import argparse
import os
import json
import pprint

# Reformat previous version bidding rules for new version
class ReformatRules:
    BuildIns = ['Base SAYC', 'DONT', 'D0P1', 'R0P1', 'Open Rebid', 'Preemptive Overcall', \
            'New Minor Forcing', 'Responsive DBL'];
    def __init__(self, fname='baseSAYC.json'):
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        if (os.path.exists(fname) == False):
            raise FileNotFoundError(f"File {fname} does not exist.")
        
        with open(fname, 'r') as file:
            fstr = file.read()
        fstr = fstr.replace('\n', '')
        vars = fstr.split('};')
        self.data = []
        for v in vars:
            if (v.find('{') < 0):
                continue
            v = v[v.find('{'):]
            v += '}'
            self.data.append(json.loads(v))
        self.bidQue = []
        self.fname = fname
        return

    def AbsObj(self, seq, d, newRules):
        rules = [x for x in d['BidRules'] if x['BidSeq'] == seq]
        if (len(rules) == 0):
            return

        seqObj = {'Seq': seq, 'Bids': []}
        for x in rules:
            key = x['Bid']
            y = [x for x in seqObj['Bids'] if x.get('Bid') == key]
            if (len(y) <= 0):
                seqObj['Bids'].append({'Bid': key, 'Criteria': []})
                y = seqObj['Bids'][-1]
            else:
                y = y[0]
            if 'Criteria' in x:
                y['Criteria'].append(x['Criteria'])
            for k in ['Convention', 'GF', 'Forcing']:
                if k in x:
                    if 'Criteria' not in y or len(y['Criteria']) == 0:
                        y['Criteria'] = [{'Meta': {}}]
                    elif 'Meta' not in y['Criteria'][len(y['Criteria'])-1]:
                        y['Criteria'][len(y['Criteria'])-1]['Meta'] = {}
                    y['Criteria'][len(y['Criteria'])-1]['Meta'][k] = x[k]
            self.addToQueue(x['Bid'], seq)
        newRules.append(seqObj)
    
    def addToQueue(self, bid, seq):
        toAdd = [*seq, bid]
        if (toAdd not in self.bidQue):
            self.bidQue.append(toAdd)

        toAdd = [*toAdd, '-']
        if (toAdd not in self.bidQue):
            self.bidQue.append(toAdd)

    def loopVars(self):
        allVars = [];
        for v in self.data:
            r = self.loopQ(v)
            varname = self.makeVarName(v['System Name'])
            outObj = {'Flag': varname, 'Name': v['System Name'], 'BidRules': r}
            if v['System Name'] in ReformatRules.BuildIns:
                outObj['BuildIn'] = True
            self.reorderOpens(outObj)
            allVars.append([varname, outObj])
        self.output(allVars, self.fname)

    def loopQ(self, d):
        r = self.seedQue(d)
        while (len(self.bidQue) > 0):
            seq = self.bidQue.pop(0)
            self.AbsObj(seq, d, r)
        return r

    def seedQue(self, d):
        self.rootSet = []
        for x in d['BidRules']:
            if x['BidSeq'] not in self.rootSet and self.noPrecedeccsor(x['BidSeq'], d):
                self.rootSet.append(x['BidSeq'])
        r = []
        for x in self.rootSet:
            self.AbsObj(x, d, r)
        return r

    def noPrecedeccsor(self, seq, d):
        if (len(seq) == 0):
            return True
        for x in self.bidQue:
            if (x == seq):
                return False
        t = seq[:-1]
        while (len(t) >= 0):
            for y in d['BidRules']:
                if y['BidSeq'] == t:
                    return False
            if (len(t) == 0):
                break
            t = t[:-1]
        return True

    def makeName(self, seq):
        str = ''
        for i in seq:
            if (i == '-'):
                str += 'p'
            else:
                str += i
        return str

    def makeVarName(self, name):
        for c in [' ', '-', '/', '.']:
           name = name.replace(c, '')
        return name

    def reorderOpens(self, rules):
        if rules['Flag'] != 'BaseSAYC':
            return
        
        neworders = list(range(len(rules['BidRules'][0]['Bids'])))
        neworders[0] = 2
        neworders[1] = 3
        neworders[2] = 4
        neworders[3] = 5
        neworders[4] = 0
        neworders[5] = 1
        n = [rules['BidRules'][0]['Bids'][i] for i in neworders]
        rules['BidRules'][0]['Bids'] = n
        return
        
    def output(self, vars, fname):
        base, ext = os.path.splitext(fname)
        f = open(f'../data/{base}.data', 'w')
        for v in vars:
            print(f"BidComponents.push(", end='', file=f)
            p = pprint.PrettyPrinter(indent=2,width=132)
            s = p.pformat(v[1])
            s = s.replace('True', 'true')
            s = s.replace('False', 'false')
            s += ');\n'
            print(s, file=f)

if __name__ == "__main__":
    # Example usage
    parser = argparse.ArgumentParser()
    parser.add_argument('-f', '--file', type=str, default='base.json')
    parser.add_argument('-a', '--all', action='store_true')
    args = parser.parse_args()
    allFiles = ['base.json', 'ntcompete.json', 'gib2o1.json', 'lebensohl.json', 'nmf.json', 'supplemental.json', 'thurston.json']

    if not args.all:
        allFiles = [args.file]
    for f in allFiles:
        newrule = ReformatRules(f)
        newrule.loopVars()
