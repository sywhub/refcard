#!/usr/bin/env python3
"""Generate RKCB bidding rules in the same structure as rkcb.data."""


class RKCBGenerator:
    def __init__(self):
        self.suit_order = ["S", "H", "D", "C"]

    def ask_sequences(self):
        sequences = [
            ["1S", "-", "4NT", "-"],
            ["1H", "-", "4NT", "-"],
            ["4S", "-", "4NT", "-"],
            ["4H", "-", "4NT", "-"],
            ["1NT", "-", "2D", "-", "3H", "-", "4NT", "-"],
            ["1NT", "-", "2H", "-", "3S", "-", "4NT", "-"],
            ["2NT", "-", "3D", "-", "4H", "-", "4NT", "-"],
            ["2NT", "-", "3H", "-", "4S", "-", "4NT", "-"],
        ]

        for opener in ["1S", "1H", "1D", "1C"]:
            sequences.append([opener, "1NT", "-", "2D", "-", "3H", "-", "4NT", "-"])
            sequences.append([opener, "1NT", "-", "2H", "-", "3S", "-", "4NT", "-"])

        return sequences

    def trump_for_seq(self, seq):
        idx = seq.index("4NT")
        for token in reversed(seq[:idx]):
            if token and token[-1] in self.suit_order:
                return token[-1]
        raise ValueError(f"Cannot determine trump for sequence: {seq}")

    def used_suits(self, seq):
        used = set()
        for token in seq:
            if token and token[-1] in self.suit_order:
                used.add(token[-1])
        return used

    def keycard_responses(self):
        return [
            {
                "Bid": "5C",
                "Criteria": [{"KeyCard": [0, 3], "Meta": {"Convention": "RKCB"}}],
            },
            {
                "Bid": "5D",
                "Criteria": [{"KeyCard": [1, 4], "Meta": {"Convention": "RKCB"}}],
            },
            {
                "Bid": "5H",
                "Criteria": [
                    {"KeyCard": 2, "Meta": {"Convention": "RKCB"}, "TrumpQ": "false"}
                ],
            },
            {
                "Bid": "5S",
                "Criteria": [
                    {"KeyCard": 2, "Meta": {"Convention": "RKCB"}, "TrumpQ": "true"}
                ],
            },
        ]

    def queen_ask_rules(self, prefix):
        meta = {"Meta": {"Convention": "RKCB"}}
        return [
            {
                "Bids": [
                    {"Bid": "5D", "Criteria": [meta]},
                    {"Bid": "5NT", "Criteria": [meta]},
                ],
                "Seq": prefix + ["5C", "-"],
            },
            {
                "Bids": [
                    {"Bid": "5H", "Criteria": [meta]},
                    {"Bid": "5NT", "Criteria": [meta]},
                ],
                "Seq": prefix + ["5D", "-"],
            },
            {
                "Bids": [{"Bid": "5NT", "Criteria": [meta]}],
                "Seq": prefix + ["5H", "-"],
            },
            {
                "Bids": [{"Bid": "5NT", "Criteria": [meta]}],
                "Seq": prefix + ["5S", "-"],
            },
        ]

    def queen_answer_rule(self, prefix, keycard_response):
        trump = self.trump_for_seq(prefix)
        used = self.used_suits(prefix)
        other_suits = [s for s in self.suit_order if s != trump and s not in used]

        ask_bid = "5D" if keycard_response == "5C" else "5H"
        no_q_bid = f"5{trump}"

        bids = [
            {
                "Bid": no_q_bid,
                "Criteria": [
                    {"Meta": {"Convention": "RKCB"}, "TrumpQ": "false"}
                ],
            },
            {
                "Bid": "5NT",
                "Criteria": [
                    {
                        "Meta": {"Convention": "RKCB"},
                        "SideKing": "false",
                        "TrumpQ": "true",
                    }
                ],
            },
        ]

        for suit in other_suits:
            bids.append(
                {
                    "Bid": "5S" if suit == "S" else f"6{suit}",
                    "Criteria": [
                        {
                            "Meta": {"Convention": "RKCB"},
                            "SideKing": "true",
                            "TrumpQ": "true",
                        }
                    ],
                }
            )

        return {
            "Bids": bids,
            "Seq": prefix + [keycard_response, "-", ask_bid, "-"],
        }

    def king_ask_rule(self, prefix, keycard_response):
        bids = [
            {
                "Bid": "6C",
                "Criteria": [{"KingCount": 0, "Meta": {"Convention": "RKCB"}}],
            },
            {
                "Bid": "6D",
                "Criteria": [{"KingCount": 1, "Meta": {"Convention": "RKCB"}}],
            },
            {
                "Bid": "6H",
                "Criteria": [{"KingCount": 2, "Meta": {"Convention": "RKCB"}}],
            },
            {
                "Bid": "6S",
                "Criteria": [{"KingCount": 3, "Meta": {"Convention": "RKCB"}}],
            },
        ]
        return {
            "Bids": bids,
            "Seq": prefix + [keycard_response, "-", "5NT", "-"],
        }

    def all_rules(self):
        rules = []

        for prefix in self.ask_sequences():
            rules.append({"Bids": self.keycard_responses(), "Seq": prefix})

        for prefix in self.ask_sequences():
            rules.extend(self.queen_ask_rules(prefix))

        for prefix in self.ask_sequences():
            rules.append(self.queen_answer_rule(prefix, "5C"))
            rules.append(self.king_ask_rule(prefix, "5C"))
            rules.append(self.queen_answer_rule(prefix, "5D"))
            rules.append(self.king_ask_rule(prefix, "5D"))
            rules.append(self.king_ask_rule(prefix, "5H"))
            rules.append(self.king_ask_rule(prefix, "5S"))

        return rules

    def print_rule(self, rule):
        bids = rule["Bids"]
        seq = rule["Seq"]
        if len(bids) == 1:
            print(f"             {{'Bids': [{bids[0]}], 'Seq': {seq}}},")
            return

        print(f"             {{ 'Bids': [ {bids[0]},")
        for bid in bids[1:-1]:
            print(f"                         {bid},")
        print(f"                         {bids[-1]}],")
        print(f"               'Seq': {seq}}},")

    def generate(self):
        print("// RKCB")
        print("BidComponents.push({'BuildIn': 'true',")
        print("  'Name': 'RKCB',")
        print("  'Rules': [ ")

        for rule in self.all_rules():
            self.print_rule(rule)

        print("  ]});")


if __name__ == "__main__":
    RKCBGenerator().generate()
