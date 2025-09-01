/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/ogf_lottery.json`.
 */
export type OgfLottery = {
  "address": "4m3mXCycberAPBPDWJEsejEMPy48Abfs8Hk5sp5ofmX5",
  "metadata": {
    "name": "ogfLottery",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "bid",
      "discriminator": [
        199,
        56,
        85,
        38,
        146,
        243,
        37,
        158
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "id"
              }
            ]
          }
        },
        {
          "name": "bid",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  105,
                  100
                ]
              },
              {
                "kind": "arg",
                "path": "id"
              },
              {
                "kind": "arg",
                "path": "bidId"
              }
            ]
          }
        },
        {
          "name": "globalDataAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "programSolAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "u16"
        },
        {
          "name": "bidId",
          "type": "u16"
        }
      ]
    },
    {
      "name": "claim",
      "discriminator": [
        62,
        198,
        214,
        193,
        213,
        159,
        108,
        210
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "signerTokenAccount",
          "writable": true
        },
        {
          "name": "pool",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "id"
              }
            ]
          }
        },
        {
          "name": "bid",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  105,
                  100
                ]
              },
              {
                "kind": "arg",
                "path": "id"
              },
              {
                "kind": "arg",
                "path": "bidId"
              }
            ]
          }
        },
        {
          "name": "programTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "programAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  104
                ]
              }
            ]
          }
        },
        {
          "name": "globalDataAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "u16"
        },
        {
          "name": "bidId",
          "type": "u16"
        }
      ]
    },
    {
      "name": "depositToken",
      "discriminator": [
        11,
        156,
        96,
        218,
        39,
        163,
        180,
        19
      ],
      "accounts": [
        {
          "name": "signer",
          "signer": true
        },
        {
          "name": "signerTokenAccount",
          "writable": true
        },
        {
          "name": "programTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "globalDataAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "programAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  104
                ]
              }
            ]
          }
        },
        {
          "name": "zeroPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "const",
                "value": [
                  0,
                  0
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "initialize2",
      "discriminator": [
        9,
        203,
        254,
        64,
        89,
        32,
        179,
        159
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "programAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  104
                ]
              }
            ]
          }
        },
        {
          "name": "globalDataAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "programTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "programSolAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "modifyGlobalData",
      "discriminator": [
        119,
        216,
        52,
        71,
        13,
        253,
        135,
        128
      ],
      "accounts": [
        {
          "name": "signer",
          "signer": true
        },
        {
          "name": "globalDataAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "fee",
          "type": "u64"
        },
        {
          "name": "releaseLength",
          "type": "u64"
        },
        {
          "name": "maxTimeBetweenBids",
          "type": "u64"
        },
        {
          "name": "releaseAmount",
          "type": "u64"
        },
        {
          "name": "claimExpiryTime",
          "type": "u64"
        }
      ]
    },
    {
      "name": "newPool",
      "discriminator": [
        38,
        63,
        210,
        32,
        246,
        20,
        239,
        112
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "id"
              }
            ]
          }
        },
        {
          "name": "prevPool",
          "writable": true
        },
        {
          "name": "globalDataAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "u16"
        }
      ]
    },
    {
      "name": "release",
      "discriminator": [
        253,
        249,
        15,
        206,
        28,
        127,
        193,
        241
      ],
      "accounts": [
        {
          "name": "signer",
          "signer": true
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "arg",
                "path": "id"
              }
            ]
          }
        },
        {
          "name": "globalDataAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  108,
                  111,
                  98,
                  97,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "id",
          "type": "u16"
        }
      ]
    },
    {
      "name": "withdrawSol",
      "discriminator": [
        145,
        131,
        74,
        136,
        65,
        137,
        42,
        38
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "programSolAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  111,
                  108
                ]
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "withdrawToken",
      "discriminator": [
        136,
        235,
        181,
        5,
        101,
        109,
        57,
        81
      ],
      "accounts": [
        {
          "name": "signer",
          "signer": true
        },
        {
          "name": "signerTokenAccount",
          "writable": true
        },
        {
          "name": "programTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  111,
                  107,
                  101,
                  110
                ]
              }
            ]
          }
        },
        {
          "name": "programAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  104
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "bidAccount",
      "discriminator": [
        27,
        161,
        15,
        114,
        230,
        126,
        56,
        104
      ]
    },
    {
      "name": "globalData",
      "discriminator": [
        48,
        194,
        194,
        186,
        46,
        71,
        131,
        61
      ]
    },
    {
      "name": "pool",
      "discriminator": [
        241,
        154,
        109,
        4,
        17,
        177,
        109,
        188
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidId",
      "msg": "Invalid id"
    },
    {
      "code": 6001,
      "name": "bidDeadlinePassed",
      "msg": "Bid deadline passed"
    },
    {
      "code": 6002,
      "name": "bidDeadlineNotPassed",
      "msg": "Bid deadline not passed"
    },
    {
      "code": 6003,
      "name": "poolReleaseTimeNotPassed",
      "msg": "Pool release time not passed"
    },
    {
      "code": 6004,
      "name": "invalidBidId",
      "msg": "Invalid bid id"
    },
    {
      "code": 6005,
      "name": "wrongBidAccountOwner",
      "msg": "Wrong bid account owner"
    },
    {
      "code": 6006,
      "name": "invalidSigner",
      "msg": "Invalid signer"
    },
    {
      "code": 6007,
      "name": "noFeesToWithdraw",
      "msg": "No fees to withdraw"
    }
  ],
  "types": [
    {
      "name": "bidAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "u16"
          },
          {
            "name": "bidId",
            "type": "u16"
          },
          {
            "name": "bidder",
            "type": "pubkey"
          },
          {
            "name": "time",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "globalData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pools",
            "type": "u16"
          },
          {
            "name": "fee",
            "type": "u64"
          },
          {
            "name": "releaseLength",
            "type": "u64"
          },
          {
            "name": "maxTimeBetweenBids",
            "type": "u64"
          },
          {
            "name": "releaseAmount",
            "type": "u64"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "totalReleases",
            "type": "u64"
          },
          {
            "name": "claimExpiryTime",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "pool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u16"
          },
          {
            "name": "bidDeadline",
            "type": "u64"
          },
          {
            "name": "bids",
            "type": "u32"
          },
          {
            "name": "releaseTime",
            "type": "u64"
          },
          {
            "name": "balance",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
