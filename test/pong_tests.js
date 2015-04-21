var chai = require('chai');
chai.use(require('chai-string'));
var expect = chai.expect;
var pong = require('../lib/pong.js');
var Player = require('../models/Player');
var Challenge = require('../models/Challenge');
var mongoose = require('mongoose');
var sinon = require('sinon');

describe('Pong', function () {
  before(function (done) {
    pong.init();
    mongoose.connect('mongodb://localhost/pingpong_test', done);
  });

  after(function (done) {
    mongoose.disconnect(done);
  });

  beforeEach(function (done) {
    Player.remove(function () {
      Challenge.remove(done);
    });
  });

  describe('#init()', function () {
    it('sets channel', function () {
      expect(pong.channel).to.eq('#pongbot');
    });

    it('sets deltaTau', function () {
      expect(pong.deltaTau).to.eq(0.94);
    });
  });

  describe('#registerPlayer', function () {
    beforeEach(function (done) {
      pong.registerPlayer('ZhangJike').then(function () {
        done();
      });
    });

    it('creates a player record', function (done) {
      Player.where({ user_name: 'ZhangJike' }).findOne(function (err, player) {
        expect(player).not.to.be.null;
        expect(player.user_name).to.eq('ZhangJike');
        expect(player.wins).to.eq(0);
        expect(player.losses).to.eq(0);
        expect(player.elo).to.eq(0);
        expect(player.tau).to.eq(0);
        done();
      });
    });

    it('does not create a duplicate player', function (done) {
      pong.registerPlayer('ZhangJike').then(null).then(undefined, function (err) {
        expect(err).to.not.be.undefined;
        expect(err.code).to.eq(11000);
        done();
      });
    });
  });

  describe('#findPlayer', function () {
    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike').then(function () {
          done();
        });
      });

      it('finds a player', function (done) {
        pong.findPlayer('ZhangJike').then(function (player) {
          expect(player).not.to.be.null;
          expect(player.user_name).to.eq('ZhangJike');
          done();
        });
      });

      it('finds a @player', function (done) {
        pong.findPlayer('@ZhangJike').then(function (player) {
          expect(player).not.to.be.null;
          expect(player.user_name).to.eq('ZhangJike');
          done();
        });
      });
    });

    describe('without a player', function () {
      it("doesn't find player", function (done) {
        pong.findPlayer('ZhangJike').then(undefined, function(err) {
          expect(err).to.not.be.null;
          expect(err.message).to.eq("Player 'ZhangJike' does not exist.");
          done();
        });
      });
    });
  });

  describe('#findPlayers', function () {
    describe('with two players', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping'])
          .then(function () {
            done();
          });
      });

      it('finds both players', function (done) {
        pong.findPlayers(['ZhangJike', 'DengYaping']).then(function (players) {
          expect(players.length).to.eq(2);
          expect(players[0].user_name).to.eq('ZhangJike');
          expect(players[1].user_name).to.eq('DengYaping');
          done();
        });
      });
    });

    describe('without a player', function () {
      it("doesn't find player", function (done) {
        pong.findPlayer('ZhangJike').then(undefined).then(undefined, function (err) {
          expect(err).to.not.be.null;
          expect(err.message).to.eq("Player 'ZhangJike' does not exist.");
          done();
        });
      });
    });
  });

  describe('updateWins', function () {
    it('returns an error when a user cannot be found', function (done) {
      pong.updateWins(['ZhangJike']).then(undefined, function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("Player 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike').then(function () {
          done();
        });
      });

      it('increments the number of wins', function (done) {
        pong.updateWins(['ZhangJike']).then(function (player) {
          pong.findPlayer('ZhangJike').then(function (player) {
            expect(player.wins).to.eq(1);
            done();
          });
        });
      });

      it('increments the number of wins twice', function (done) {
        pong.updateWins(['ZhangJike']).then(function (player) {
          pong.updateWins(['ZhangJike']).then(function (player) {
            pong.findPlayer('ZhangJike').then(function (player) {
              expect(player.wins).to.eq(2);
              done();
            });
          });
        });
      });
    });

    describe('with two players', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping']).then(function () {
          done();
        });
      });

      it('increments the number of wins', function (done) {
        pong.updateWins(['ZhangJike', 'DengYaping']).then(function (players) {
          pong.findPlayers(['ZhangJike', 'DengYaping']).then(function(players) {
            expect(players[0].wins).to.eq(1);
            expect(players[1].wins).to.eq(1);
          }).then(function () {
            done();
          });
        });
      });
    });

  });

  describe('updateLosses', function () {
    it('returns an error when a player cannot be found', function (done) {
      pong.updateLosses(['ZhangJike']).then(undefined, function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("Player 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike').then(function () {
          done();
        });
      });

      it('increments the number of loss', function (done) {
        pong.updateLosses(['ZhangJike']).then(function (player) {
          pong.findPlayer('ZhangJike').then(function (player) {
            expect(player.losses).to.eq(1);
            done();
          });
        });
      });

      it('increments the number of loss twice', function (done) {
        pong.updateLosses(['ZhangJike']).then(function (player) {
          pong.updateLosses(['ZhangJike']).then(function (player) {
            pong.findPlayer('ZhangJike').then(function (player) {
              expect(player.losses).to.eq(2);
              done();
            });
          });
        });
      });

      describe('with another player', function () {
        beforeEach(function (done) {
          pong.registerPlayer('DengYaping').then(function () {
            done();
          });
        });

        it('increments the number of losses for multiple players', function (done) {
          pong.updateLosses(['ZhangJike', 'DengYaping']).then(function () {
            pong.findPlayers(['ZhangJike', 'DengYaping']).then(function(players) {
              expect(players[0].losses).to.eq(1);
              expect(players[1].losses).to.eq(1);
            }).then(function () {
              done();
            });
          });
        });
      });

    });
  });

  describe('setChallenge', function () {
    it('returns an error when a player cannot be found', function (done) {
      pong.setChallenge(['ZhangJike'], null).then(undefined, function(err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("Player 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike').then(function() {
          done();
        });
      });

      it('sets challenge', function(done) {
        new Challenge({
          state: 'Proposed',
          type: 'Singles',
          date: Date.now(),
          challenger: ['ZhangJike'],
          challenged: ['DengYaping']
        }).save().then(function(challenge) {
          pong.setChallenge(['ZhangJike'], challenge._id).then(function () {
            pong.findPlayer('ZhangJike').then(function (player) {
              expect(player.currentChallenge.equals(challenge._id)).to.be.true;
              done();
            });
          });
        });
      });
    });

    describe('with two players', function () {
      var challenge = null;
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping']).then(function() {
          challenge = new Challenge({
            state: 'Proposed',
            type: 'Singles',
            date: Date.now(),
            challenger: ['ZhangJike'],
            challenged: ['DengYaping']
          });
          challenge.save().then(function () {
            done();
          });
        });
      });

      it('sets challenge', function(done) {
        pong.setChallenge(['ZhangJike', 'DengYaping'], challenge._id).then(function () {
          pong.findPlayers(['ZhangJike', 'DengYaping']).then(function(players) {
            expect(players[0].currentChallenge.equals(challenge._id)).to.be.true;
            expect(players[1].currentChallenge.equals(challenge._id)).to.be.true;
          }).then(function () {
            done();
          });
        });
      });

      describe('with a challenge already set', function () {
        beforeEach(function (done) {
          pong.setChallenge(['ZhangJike'], challenge._id).then(function () {
            done();
          });
        });

        describe('with another challenge', function () {
          var challenge2 = null;
          beforeEach(function (done) {
            challenge2 = new Challenge({
              state: 'Proposed',
              type: 'Singles',
              date: Date.now(),
              challenger: ['ZhangJike'],
              challenged: ['DengYaping']
            });
            challenge2.save().then(function () {
              done();
            });
          });

          it('does not set challenge', function(done) {
            pong.setChallenge(['ZhangJike', 'DengYaping'], challenge2._id).then(function(ok) {
              }, function (err) {
                expect(err.message).to.eq("There's already an active challenge between ZhangJike and DengYaping.");
                pong.findPlayers(['ZhangJike', 'DengYaping']).then(function(players) {
                  expect(players[0].currentChallenge.equals(challenge._id)).to.be.true;
                  expect(players[1].currentChallenge).to.be.undefined;
                }).then(function () {
                  done();
                });
            });
          });
        });
      });
    });
  });

  describe('ensureUniquePlayers', function () {
    it('fails with a duplicate', function (done) {
      pong.ensureUniquePlayers(['ZhangJike', 'ZhangJike', 'ZhangJike', 'ChenQi']).then(undefined, function (err) {
        expect(err).to.not.be.null;
        expect(err.message).to.eq('Does ZhangJike have 6 hands?');
        done();
      });
    });

    it('succeeds without a duplicate', function (done) {
      pong.ensureUniquePlayers(['ZhangJike', 'ViktorBarna']).then(function (players) {
        expect(players).to.eql(['ZhangJike','ViktorBarna']);
        done();
      });
    });
  });


  describe('createSingleChallenge', function () {
    it('returns an error when the challenger cannot be found', function (done) {
      pong.createSingleChallenge('ZhangJike', 'DengYaping').then(undefined, function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("Player 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a challenger', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike').then(function () {
          done();
        });
      });

      it('requires all players to be unique', function (done) {
        pong.createSingleChallenge('ZhangJike', 'ZhangJike').then(undefined, function (err) {
          expect(err).to.not.be.null;
          expect(err.message).to.eq("Does ZhangJike have 4 hands?");
          done();
        });
      });

      it('returns an error when the challenged cannot be found', function (done) {
        pong.createSingleChallenge('ZhangJike', 'DengYaping').then(undefined, function (err) {
          expect(err).not.to.be.null;
          expect(err.message).to.eq("Player 'DengYaping' does not exist.");
          done();
        });
      });

      describe('with a challenged', function () {
        beforeEach(function (done) {
          pong.registerPlayer('DengYaping').then(function () {
            done();
          });
        });

        it('creates a challenge', function (done) {
          pong.createSingleChallenge('ZhangJike', 'DengYaping').then(function (result) {
            expect(result.message).to.eq("ZhangJike has challenged DengYaping to a ping pong match!");
            expect(result.challenge).to.not.be.null;
            pong.findPlayer('ZhangJike').then(function(challenger) {
              expect(challenger.currentChallenge).to.not.be.undefined;
              expect(result.challenge._id.equals(challenger.currentChallenge)).to.be.true;
              pong.findPlayer('DengYaping').then(function (challenged) {
                expect(challenged.currentChallenge).to.not.be.undefined;
                expect(challenged.currentChallenge.equals(challenger.currentChallenge)).to.be.true;
                done();
              });
            });
          });
        });

        describe('with an existing challenge', function (done) {
          beforeEach(function (done) {
            pong.createSingleChallenge('ZhangJike', 'DengYaping').then(function() {
              done();
            });
          });

          it('fails to create a challenge', function (done) {
            pong.createSingleChallenge('ZhangJike', 'DengYaping').then(undefined, function (err) {
              expect(err).to.not.be.null;
              expect(err.message).to.eq("There's already an active challenge between ZhangJike and DengYaping.");
              done();
            });
          });
        });
      });
    });
  });

  describe('createDoubleChallenge', function () {
    describe('with 4 players', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna']).then(function () {
          done();
        });
      });

      it('creates a challenge', function (done) {
        pong.createDoubleChallenge('ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna').then(function (result) {
          expect(result).to.not.be.null;
          expect(result.message).to.eq("ZhangJike and DengYaping have challenged ChenQi and ViktorBarna to a ping pong match!");
          expect(result.challenge).to.not.be.null;
          pong.findPlayer('ZhangJike').then(function (c1) {
            expect(c1.currentChallenge.equals(result.challenge._id)).to.be.true;
            pong.findPlayer('DengYaping').then(function (c2) {
              expect(c2.currentChallenge.equals(result.challenge._id)).to.be.true;
              pong.findPlayer('ChenQi').then(function (c3) {
                expect(c3.currentChallenge.equals(result.challenge._id)).to.be.true;
                pong.findPlayer('ViktorBarna').then(function (c4) {
                  expect(c4.currentChallenge.equals(result.challenge._id)).to.be.true;
                }).then(function () {
                  done();
                });
              });
            });
          });
        });
      });

      it('with an existing challenge between two of the players', function (done) {
        pong.createSingleChallenge('ZhangJike', 'DengYaping').then(function (challenge) {
          pong.createDoubleChallenge('ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna').then(undefined, function (err) {
            expect(err).to.not.be.null;
            expect(err.message).to.eq("There's already an active challenge between ZhangJike and DengYaping.");
            done();
          });
        });
      });

      it('requires all players to be unique', function (done) {
        pong.createDoubleChallenge('ZhangJike', 'ZhangJike', 'ChenQi', 'ViktorBarna').then(undefined, function (err) {
          expect(err).to.not.be.null;
          expect(err.message).to.eq("Does ZhangJike have 4 hands?");
          done();
        });
      });
    });
  });

  describe('acceptChallenge', function () {
    describe('with a challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping']).then(function () {
          pong.createSingleChallenge('ZhangJike', 'DengYaping').then(function () {
            done();
          });
        });
      });

      it('accepts challenge', function (done) {
        pong.acceptChallenge('DengYaping').then(function (result) {
          expect(result.message).to.eq("DengYaping accepted ZhangJike's challenge.");
          expect(result.challenge.state).to.eq('Accepted');
          done();
        });
      });

      it("can't accept a challenge twice", function (done) {
        pong.acceptChallenge('DengYaping').then(function (challenge) {
          pong.acceptChallenge('DengYaping').then(undefined, function (err) {
            expect(err.message).to.eq("You have already accepted ZhangJike's challenge.");
            done();
          });
        });
      });

      it("can't accept a challenge that doesn't exist", function (done) {
        pong.registerPlayer('ChenQi').then(function () {
          pong.acceptChallenge('DengYaping').then(function (challenge) {
            pong.acceptChallenge('ChenQi').then(undefined, function (err) {
              expect(err.message).to.eq('No challenge to accept.');
              done();
            });
          });
        });
      });
    });
  });

  describe('declineChallenge', function () {
    describe('with a challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping']).then(function () {
          pong.createSingleChallenge('ZhangJike', 'DengYaping').then(function () {
            done();
          });
        });
      });

      it('declines challenge', function (done) {
        pong.declineChallenge('DengYaping').then(function (result) {
          expect(result.message).to.eq("DengYaping declined ZhangJike's challenge.");
          expect(result.challenge.state).to.eq('Declined');
          done();
        });
      });

      it("can't decline a challenge twice", function (done) {
        pong.declineChallenge('DengYaping').then(function (challenge) {
          pong.declineChallenge('DengYaping').then(undefined, function (err) {
            expect(err.message).to.eq("No challenge to decline.");
            done();
          });
        });
      });
    });
  });

  describe('calculateTeamElo', function () {
    beforeEach('with two players', function (done) {
      pong.registerPlayer('ZhangJike').then(function (player1) {
        player1.elo = 4;
        player1.save().then(function () {
          pong.registerPlayer('DengYaping').then(function (player2) {
            player2.elo = 2;
            player2.save().then(function () {
              done();
            });
          });
        });
      });
    });

    it('returns average of elo', function (done) {
      pong.calculateTeamElo('ZhangJike', 'DengYaping').then(function (elo) {
        expect(elo).to.eq(3);
        done();
      });
    });
  });

  describe('eloSinglesChange', function () {
    beforeEach(function (done) {
      pong.registerPlayers(['ZhangJike', 'DengYaping']).then(function () {
        done();
      });
    });

    it('updates elo after a challenge', function (done) {
      pong.eloSinglesChange('ZhangJike', 'DengYaping').then(function (players) {
        var winner = players[0];
        var loser = players[1];
        expect(winner.elo).to.eq(48);
        expect(winner.tau).to.eq(0.5);
        expect(loser.elo).to.eq(-48);
        expect(loser.tau).to.eq(0.5);
        done();
      });
    });
  });

  describe('eloDoublesChange', function () {
    beforeEach(function (done) {
      pong.registerPlayers(['ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna']).then(function () {
        done();
      });
    });

    it('updates elo after a challenge', function (done) {
      pong.eloDoublesChange('ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna').then(function (players) {
        expect(players[0].elo).to.eq(48);
        expect(players[0].tau).to.eq(0.5);
        expect(players[1].elo).to.eq(48);
        expect(players[1].tau).to.eq(0.5);
        expect(players[2].elo).to.eq(-48);
        expect(players[2].tau).to.eq(0.5);
        expect(players[3].elo).to.eq(-48);
        expect(players[3].tau).to.eq(0.5);
        done();
      });
    });
  });

  describe('win and lose', function () {
    describe('with a single challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping']).then(function () {
          pong.createSingleChallenge('ZhangJike', 'DengYaping').then(function () {
            done();
          });
        });
      });

      it('challenge must be accepted', function (done) {
        pong.win('ZhangJike').then(undefined, function (err) {
          expect(err).not.to.be.null;
          expect(err.message).to.eq("Challenge needs to be accepted before recording match.");
          done();
        });
      });

      describe('challenge accepted', function () {
        beforeEach(function (done) {
          pong.acceptChallenge('DengYaping').then(function () {
            done();
          });
        });

        it('player one wins', function (done) {
          pong.win('ZhangJike').then(function (result) {
            expect(result.message).to.eq("Match has been recorded, ZhangJike defeated DengYaping.");
            pong.findPlayer('ZhangJike').then(function (player) {
              expect(player.wins).to.eq(1);
              expect(player.tau).to.eq(0.5);
              expect(player.elo).to.eq(48);
              expect(player.losses).to.eq(0);
              pong.findPlayer('DengYaping').then(function (player) {
                expect(player.wins).to.eq(0);
                expect(player.tau).to.eq(0.5);
                expect(player.elo).to.eq(-48);
                expect(player.losses).to.eq(1);
                done();
              });
            });
          });
        });

        it('player two wins', function (done) {
          pong.win('DengYaping').then(function (result) {
            expect(result.message).to.eq("Match has been recorded, DengYaping defeated ZhangJike.");
            pong.findPlayer('DengYaping').then(function (player) {
              expect(player.wins).to.eq(1);
              expect(player.tau).to.eq(0.5);
              expect(player.elo).to.eq(48);
              expect(player.losses).to.eq(0);
              pong.findPlayer('ZhangJike').then(function (player) {
                expect(player.wins).to.eq(0);
                expect(player.tau).to.eq(0.5);
                expect(player.elo).to.eq(-48);
                expect(player.losses).to.eq(1);
                done();
              });
            });
          });
        });

        it('player one loses', function (done) {
          pong.lose('ZhangJike').then(function (result) {
            expect(result.message).to.eq("Match has been recorded, DengYaping defeated ZhangJike.");
            pong.findPlayer('ZhangJike').then(function (player) {
              expect(player.wins).to.eq(0);
              expect(player.tau).to.eq(0.5);
              expect(player.elo).to.eq(-48);
              expect(player.losses).to.eq(1);
              pong.findPlayer('DengYaping').then(function (player) {
                expect(player.wins).to.eq(1);
                expect(player.tau).to.eq(0.5);
                expect(player.elo).to.eq(48);
                expect(player.losses).to.eq(0);
                done();
              });
            });
          });
        });

        it('player two loses', function (done) {
          pong.lose('DengYaping').then(function (result) {
            expect(result.message).to.eq("Match has been recorded, ZhangJike defeated DengYaping.");
            pong.findPlayer('DengYaping').then(function (player) {
              expect(player.wins).to.eq(0);
              expect(player.tau).to.eq(0.5);
              expect(player.elo).to.eq(-48);
              expect(player.losses).to.eq(1);
              pong.findPlayer('ZhangJike').then(function (player) {
                expect(player.wins).to.eq(1);
                expect(player.tau).to.eq(0.5);
                expect(player.elo).to.eq(48);
                expect(player.losses).to.eq(0);
                done();
              });
            });
          });
        });
      });
    });

    describe('with an accepted doubles challenge', function () {
      beforeEach(function (done) {
        pong.registerPlayers(['ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna']).then(function () {
          pong.createDoubleChallenge('ZhangJike', 'DengYaping', 'ChenQi', 'ViktorBarna').then(function (challenge) {
            pong.acceptChallenge('DengYaping').then(function () {
                done();
            });
          });
        });
      });

      it('player one wins', function (done) {
        pong.win('ZhangJike').then(function (result) {
          expect(result).not.to.be.null;
          expect(result.message).to.eq("Match has been recorded, ZhangJike and DengYaping defeated ChenQi and ViktorBarna.");
          pong.findPlayer('ZhangJike').then(function (player) {
            expect(player.wins).to.eq(1);
            expect(player.tau).to.eq(0.5);
            expect(player.elo).to.eq(48);
            expect(player.losses).to.eq(0);
            pong.findPlayer('DengYaping').then(function (player) {
              expect(player.wins).to.eq(1);
              expect(player.tau).to.eq(0.5);
              expect(player.elo).to.eq(48);
              expect(player.losses).to.eq(0);
              pong.findPlayer('ChenQi').then(function (player) {
                expect(player.wins).to.eq(0);
                expect(player.tau).to.eq(0.5);
                expect(player.elo).to.eq(-48);
                expect(player.losses).to.eq(1);
                pong.findPlayer('ViktorBarna').then(function (player) {
                  expect(player.wins).to.eq(0);
                  expect(player.tau).to.eq(0.5);
                  expect(player.elo).to.eq(-48);
                  expect(player.losses).to.eq(1);
                  done();
                });
              });
            });
          });
        });
      });

      it('player two wins', function (done) {
        pong.win('DengYaping').then(function (result) {
          expect(result).not.to.be.null;
          expect(result.message).to.eq("Match has been recorded, ZhangJike and DengYaping defeated ChenQi and ViktorBarna.");
          pong.findPlayer('ZhangJike').then(function (player) {
            expect(player.wins).to.eq(1);
            expect(player.tau).to.eq(0.5);
            expect(player.elo).to.eq(48);
            expect(player.losses).to.eq(0);
            pong.findPlayer('DengYaping').then(function (player) {
              expect(player.wins).to.eq(1);
              expect(player.tau).to.eq(0.5);
              expect(player.elo).to.eq(48);
              expect(player.losses).to.eq(0);
              pong.findPlayer('ChenQi').then(function (player) {
                expect(player.wins).to.eq(0);
                expect(player.tau).to.eq(0.5);
                expect(player.elo).to.eq(-48);
                expect(player.losses).to.eq(1);
                pong.findPlayer('ViktorBarna').then(function (player) {
                  expect(player.wins).to.eq(0);
                  expect(player.tau).to.eq(0.5);
                  expect(player.elo).to.eq(-48);
                  expect(player.losses).to.eq(1);
                  done();
                });
              });
            });
          });
        });
      });

      it('player three wins', function (done) {
        pong.win('ChenQi').then(function (result) {
          expect(result).not.to.be.null;
          expect(result.message).to.eq("Match has been recorded, ChenQi and ViktorBarna defeated ZhangJike and DengYaping.");
          pong.findPlayer('ChenQi').then(function (player) {
            expect(player.wins).to.eq(1);
            expect(player.tau).to.eq(0.5);
            expect(player.elo).to.eq(48);
            expect(player.losses).to.eq(0);
            pong.findPlayer('ViktorBarna').then(function (player) {
              expect(player.wins).to.eq(1);
              expect(player.tau).to.eq(0.5);
              expect(player.elo).to.eq(48);
              expect(player.losses).to.eq(0);
              pong.findPlayer('DengYaping').then(function (player) {
                expect(player.wins).to.eq(0);
                expect(player.tau).to.eq(0.5);
                expect(player.elo).to.eq(-48);
                expect(player.losses).to.eq(1);
                pong.findPlayer('ZhangJike').then(function (player) {
                  expect(player.wins).to.eq(0);
                  expect(player.tau).to.eq(0.5);
                  expect(player.elo).to.eq(-48);
                  expect(player.losses).to.eq(1);
                  done();
                });
              });
            });
          });
        });
      });

      it('player four wins', function (done) {
        pong.win('ViktorBarna').then(function (result) {
          expect(result).not.to.be.null;
          expect(result.message).to.eq("Match has been recorded, ChenQi and ViktorBarna defeated ZhangJike and DengYaping.");
          pong.findPlayer('ChenQi').then(function (player) {
            expect(player.wins).to.eq(1);
            expect(player.tau).to.eq(0.5);
            expect(player.elo).to.eq(48);
            expect(player.losses).to.eq(0);
            pong.findPlayer('ViktorBarna').then(function (player) {
              expect(player.wins).to.eq(1);
              expect(player.tau).to.eq(0.5);
              expect(player.elo).to.eq(48);
              expect(player.losses).to.eq(0);
              pong.findPlayer('DengYaping').then(function (player) {
                expect(player.wins).to.eq(0);
                expect(player.tau).to.eq(0.5);
                expect(player.elo).to.eq(-48);
                expect(player.losses).to.eq(1);
                pong.findPlayer('ZhangJike').then(function (player) {
                  expect(player.wins).to.eq(0);
                  expect(player.tau).to.eq(0.5);
                  expect(player.elo).to.eq(-48);
                  expect(player.losses).to.eq(1);
                  done();
                });
              });
            });
          });
        });
      });

      it('player one loses', function (done) {
        pong.lose('ZhangJike').then(function (result) {
          expect(result).not.to.be.null;
          expect(result.message).to.eq("Match has been recorded, ChenQi and ViktorBarna defeated ZhangJike and DengYaping.");
          pong.findPlayer('ChenQi').then(function (player) {
            expect(player.wins).to.eq(1);
            expect(player.tau).to.eq(0.5);
            expect(player.elo).to.eq(48);
            expect(player.losses).to.eq(0);
            pong.findPlayer('ViktorBarna').then(function (player) {
              expect(player.wins).to.eq(1);
              expect(player.tau).to.eq(0.5);
              expect(player.elo).to.eq(48);
              expect(player.losses).to.eq(0);
              pong.findPlayer('DengYaping').then(function (player) {
                expect(player.wins).to.eq(0);
                expect(player.tau).to.eq(0.5);
                expect(player.elo).to.eq(-48);
                expect(player.losses).to.eq(1);
                pong.findPlayer('ZhangJike').then(function (player) {
                  expect(player.wins).to.eq(0);
                  expect(player.tau).to.eq(0.5);
                  expect(player.elo).to.eq(-48);
                  expect(player.losses).to.eq(1);
                  done();
                });
              });
            });
          });
        });
      });

      it('player two loses', function (done) {
        pong.lose('DengYaping').then(function (result) {
          expect(result).not.to.be.null;
          expect(result.message).to.eq("Match has been recorded, ChenQi and ViktorBarna defeated ZhangJike and DengYaping.");
          pong.findPlayer('ChenQi').then(function (player) {
            expect(player.wins).to.eq(1);
            expect(player.tau).to.eq(0.5);
            expect(player.elo).to.eq(48);
            expect(player.losses).to.eq(0);
            pong.findPlayer('ViktorBarna').then(function (player) {
              expect(player.wins).to.eq(1);
              expect(player.tau).to.eq(0.5);
              expect(player.elo).to.eq(48);
              expect(player.losses).to.eq(0);
              pong.findPlayer('DengYaping').then(function (player) {
                expect(player.wins).to.eq(0);
                expect(player.tau).to.eq(0.5);
                expect(player.elo).to.eq(-48);
                expect(player.losses).to.eq(1);
                pong.findPlayer('ZhangJike').then(function (player) {
                  expect(player.wins).to.eq(0);
                  expect(player.tau).to.eq(0.5);
                  expect(player.elo).to.eq(-48);
                  expect(player.losses).to.eq(1);
                  done();
                });
              });
            });
          });
        });
      });

      it('player three loses', function (done) {
        pong.lose('ChenQi').then(function (result) {
          expect(result).not.to.be.null;
          expect(result.message).to.eq("Match has been recorded, ZhangJike and DengYaping defeated ChenQi and ViktorBarna.");
          pong.findPlayer('ZhangJike').then(function (player) {
            expect(player.wins).to.eq(1);
            expect(player.tau).to.eq(0.5);
            expect(player.elo).to.eq(48);
            expect(player.losses).to.eq(0);
            pong.findPlayer('DengYaping').then(function (player) {
              expect(player.wins).to.eq(1);
              expect(player.tau).to.eq(0.5);
              expect(player.elo).to.eq(48);
              expect(player.losses).to.eq(0);
              pong.findPlayer('ChenQi').then(function (player) {
                expect(player.wins).to.eq(0);
                expect(player.tau).to.eq(0.5);
                expect(player.elo).to.eq(-48);
                expect(player.losses).to.eq(1);
                pong.findPlayer('ViktorBarna').then(function (player) {
                  expect(player.wins).to.eq(0);
                  expect(player.tau).to.eq(0.5);
                  expect(player.elo).to.eq(-48);
                  expect(player.losses).to.eq(1);
                  done();
                });
              });
            });
          });
        });
      });

      it('player four loses', function (done) {
        pong.lose('ViktorBarna').then(function (result) {
          expect(result).not.to.be.null;
          expect(result.message).to.eq("Match has been recorded, ZhangJike and DengYaping defeated ChenQi and ViktorBarna.");
          pong.findPlayer('ZhangJike').then(function (player) {
            expect(player.wins).to.eq(1);
            expect(player.tau).to.eq(0.5);
            expect(player.elo).to.eq(48);
            expect(player.losses).to.eq(0);
            pong.findPlayer('DengYaping').then(function (player) {
              expect(player.wins).to.eq(1);
              expect(player.tau).to.eq(0.5);
              expect(player.elo).to.eq(48);
              expect(player.losses).to.eq(0);
              pong.findPlayer('ChenQi').then(function (player) {
                expect(player.wins).to.eq(0);
                expect(player.tau).to.eq(0.5);
                expect(player.elo).to.eq(-48);
                expect(player.losses).to.eq(1);
                pong.findPlayer('ViktorBarna').then(function (player) {
                  expect(player.wins).to.eq(0);
                  expect(player.tau).to.eq(0.5);
                  expect(player.elo).to.eq(-48);
                  expect(player.losses).to.eq(1);
                  done();
                });
              });
            });
          });
        });
      });
    });
  });

  describe('reset', function () {
    it('returns an error when a player cannot be found', function (done) {
      pong.reset('ZhangJike').then(undefined, function (err) {
        expect(err).not.to.be.null;
        expect(err.message).to.eq("Player 'ZhangJike' does not exist.");
        done();
      });
    });

    describe('with a player', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike').then(function (player) {
          player.wins = 42;
          player.losses = 24;
          player.tau = 3;
          player.elo = 158;
          player.save().then(function () {
            done();
          });
        });
      });

      it('resets player fields', function (done) {
        pong.reset('ZhangJike').then(function () {
          pong.findPlayer('ZhangJike').then(function (player) {
            expect(player.wins).to.eq(0);
            expect(player.tau).to.eq(1);
            expect(player.elo).to.eq(0);
            expect(player.losses).to.eq(0);
            done();
          });
        });
      });
    });
  });

  describe('resetAll', function () {
    describe('with two players', function () {
      beforeEach(function (done) {
        pong.registerPlayer('ZhangJike').then(function (player) {
          player.wins = 42;
          player.losses = 24;
          player.tau = 3;
          player.elo = 158;
          player.save(function () {
            pong.registerPlayer('ViktorBarna').then(function (player) {
              player.wins = 4;
              player.losses = 4;
              player.tau = 3;
              player.elo = 18;
              player.save(function () {
                done();
              });
            });
          });
        });
      });

      it('resets all players', function (done) {
        pong.resetAll().then(function () {
          pong.findPlayer('ZhangJike').then(function (player) {
            expect(player.wins).to.eq(0);
            expect(player.tau).to.eq(1);
            expect(player.elo).to.eq(0);
            expect(player.losses).to.eq(0);
            pong.findPlayer('ViktorBarna').then(function (player) {
              expect(player.wins).to.eq(0);
              expect(player.tau).to.eq(1);
              expect(player.elo).to.eq(0);
              expect(player.losses).to.eq(0);
              done();
            });
          });
        });
      });
    });
  });

  describe('getDuelGif', function () {
    it('returns a gif', function (done) {
      pong.getDuelGif().then(function (gif) {
        expect(gif).to.startsWith('http');
        done();
      });
    });
  });

  describe("playerToS", function(){
    var currentUser = null;
    beforeEach(function(done){
      pong.registerPlayer('ZhangJike').then(function (player) {
        currentUser = player;
        done();
      });
    });

    it("prints a newly registered player", function () {
      expect(pong.playerToS(currentUser)).to.eq("ZhangJike: 0 wins 0 losses (elo: 0)");
    });
  });

  describe("playersToS", function() {
    var sortedPlayers = null;
    beforeEach(function() {
      var worst = new Player({ user_name: 'worst', wins: 0, losses: 2, elo: 0, tau: 0 });
      var middle = new Player({ user_name: 'middle', wins: 1, losses: 1, elo: 10, tau: 0 });
      var best = new Player({ user_name: 'best', wins: 2, losses: 0, elo: 20, tau: 0 });
      sortedPlayers = [best, middle, worst];
    });

    it("prints a leaderboard correctly", function () {
      expect(pong.playersToS(sortedPlayers)).to.eq(
        "1. best: 2 wins 0 losses (elo: 20)\n" +
        "2. middle: 1 win 1 loss (elo: 10)\n" +
        "3. worst: 0 wins 2 losses (elo: 0)\n"
      );
    });

    it("prints a leaderboard with ties correctly", function () {
      sortedPlayers = sortedPlayers.concat(sortedPlayers[2]);
      sortedPlayers = [sortedPlayers[0]].concat(sortedPlayers);
      expect(pong.playersToS(sortedPlayers)).to.eq(
        "1. best: 2 wins 0 losses (elo: 20)\n" +
        "1. best: 2 wins 0 losses (elo: 20)\n" +
        "3. middle: 1 win 1 loss (elo: 10)\n" +
        "4. worst: 0 wins 2 losses (elo: 0)\n" +
        "4. worst: 0 wins 2 losses (elo: 0)\n"
      );
    });
  });
});
