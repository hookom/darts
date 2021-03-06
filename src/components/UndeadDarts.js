import React, { Component } from 'react';
import moment from 'moment';
import Table, { TableBody, TableCell, TableRow } from 'material-ui/Table';
import Reboot from 'material-ui/Reboot';
import Collapse from 'material-ui/transitions/Collapse';
import IconButton from 'material-ui/IconButton';
import Button from 'material-ui/Button';
import ExpandMoreIcon from 'material-ui-icons/ExpandMore';
import { withStyles } from 'material-ui/styles';

import Bracket from './Bracket.js'
import TrackedStats from '../lib/TrackedStats.js'
import helpers from '../lib/helpers.js';
import controller from '../lib/controller.js';
import ChangeHistory from './ChangeHistory.js';
import SeasonSelector from './SeasonSelector.js';
import ZombieInput from './ZombieInput.js';
import AppHeader from './AppHeader.js';
import PlayerStats from './PlayerStats.js'

import '../App.css';
import 'typeface-roboto';

class UndeadDarts extends Component {
  state = {
      allStatsWithTotals: [],
      selectedSeasonStats: [],
      selectedSeason: '',
      seasonInProgress: '',
      seasons: [],
      changelog: [],
      kingPoints: 0,
      zombiewins: 0,
      historyExpanded: false,
      participants: []
  };

  componentDidMount() {
    controller.getAllStats()
      .then(res => {
        let allStatsWithTotals = helpers.setTotalPointsFor(res.data);
        let seasons = res.data.filter(x => x.name === 'ZOMBIES').map(row => row.season);
        let selectedSeason = seasons[seasons.length - 1];
        let selectedSeasonStats = allStatsWithTotals.filter(x => x.season === selectedSeason);
        this.setState({
          allStatsWithTotals,
          selectedSeasonStats,
          selectedSeason,
          seasonInProgress: selectedSeason,
          kingPoints: helpers.getKingTotal(selectedSeasonStats),
          zombiewins: selectedSeasonStats.filter(x => x.name === 'ZOMBIES')[0].zombiewins,
          seasons
        });
      });

    controller.getChangelog()
      .then(res => {
        this.setState({changelog: res.data});
      });
  }

  render() {
    return (
      <div className="App">
        <Reboot />
        <AppHeader/>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <Button
                  onClick={this.startGame}
                  disabled={this.state.participants.length < 1 || this.state.selectedSeason !== this.state.seasonInProgress}>Start</Button>
              </TableCell>
              <TableCell>
                <ZombieInput
                  zombiewins={this.state.zombiewins}
                  onCellChange={this.onCellChange}
                  season={this.state.selectedSeason}
                />
              </TableCell>
              <TableCell>
                <SeasonSelector 
                  selectedSeason={this.state.selectedSeason} 
                  seasons={this.state.seasons}
                  setSelectedSeason={this.setSelectedSeason}
                  create={this.createNewSeason}
                />
              </TableCell>
              <TableCell>
                <Button
                  onClick={this.decrementGame}
                  disabled={this.state.participants.length !== 1 || this.state.selectedSeason !== this.state.seasonInProgress}>gamesplayed --</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <PlayerStats
          stats={this.state.selectedSeasonStats}
          kingPoints={this.state.kingPoints}
          onCellChange={this.onCellChange}
          seasonInProgress={this.state.seasonInProgress}
          addPlayer={this.addNewPlayer}
          toggleParticipating={this.toggleParticipating}
          participants={this.state.participants}
        />
        <IconButton onClick={() => this.setState({ historyExpanded: !this.state.historyExpanded })}>
          <h4>History</h4>
          <ExpandMoreIcon />
        </IconButton> 
        <Collapse in={this.state.historyExpanded} timeout="auto" unmountOnExit>
          <ChangeHistory changelog={this.state.changelog}/>
        </Collapse>
        <Bracket players={ helpers.getOrderedPlayerNames(this.state.selectedSeasonStats) }/>
      </div>
    );
  }

  onCellChange = (modifiedColumn, modifiedRow, newValue, initValue) => {
    let newStats = this.state.allStatsWithTotals;
    newStats.filter(x => x.season === modifiedRow.season && x.name === modifiedRow.name)[0][modifiedColumn] = newValue;

    let changeDescription = modifiedRow.name
                            + ':' + modifiedRow.season
                            + ':' + modifiedColumn
                            + ':' + initValue + '-->' + newValue;
    let ts = moment().format('YYYY-MM-DD HH:mm:ss');

    controller.updateStat(
      {
        stat: {
          field: modifiedColumn,
          value: newValue,
          name: modifiedRow.name,
          season: modifiedRow.season
        },
        changelog: {
          message: changeDescription,
          timestamp: ts
        }
      }
    );

    let newLog = this.state.changelog;
    newLog.unshift({message: changeDescription, timestamp: ts});

    let allStatsWithTotals = helpers.setTotalPointsFor(newStats, [modifiedRow.name]);
    let selectedSeasonStats = allStatsWithTotals.filter(x => x.season === this.state.selectedSeason);
    let kingPoints = helpers.getKingTotal(selectedSeasonStats);
    let zombiewins = selectedSeasonStats.filter(x => x.name === 'ZOMBIES')[0].zombiewins;
    
    this.setState({
      allStatsWithTotals,
      selectedSeasonStats,
      changelog: newLog,
      kingPoints,
      zombiewins,
      participants: []
    });
  }

  toggleParticipating = (name) => {
    let participants = this.state.participants;
    if (participants.includes(name)) {
      participants = participants.filter(x => x !== name);
    } else {
      participants.push(name);
    }

    this.setState({participants});
  }

  startGame = () => {
    this.state.participants.forEach(name => {
      let row = this.state.selectedSeasonStats.filter(x => x.name === name)[0];
      this.onCellChange(
        'gamesplayed',
        row,
        parseInt(row.gamesplayed, 10) + 1
      );
    })
  }

  decrementGame = () => {
    let row = this.state.selectedSeasonStats.filter(x => x.name === this.state.participants[0])[0];
    this.onCellChange(
      'gamesplayed',
      row,
      parseInt(row.gamesplayed, 10) - 1
    );
  }

  setSelectedSeason = (season) => {
    let selectedSeason = season;
    let selectedSeasonStats = this.state.allStatsWithTotals.filter(x => x.season === selectedSeason);
    let kingPoints = helpers.getKingTotal(selectedSeasonStats);
    let zombiewins = selectedSeasonStats.filter(x => x.name === 'ZOMBIES')[0].zombiewins;
    this.setState({
      selectedSeasonStats,
      selectedSeason,
      kingPoints,
      zombiewins
    });
  }

  createNewSeason = (newSeasonId) => {
    let playerNames = [];
    let newSeasonStats = this.state.selectedSeasonStats;
    let statVersion = this.state.selectedSeasonStats[0].statversion;
    let allStatsWithTotals = this.state.allStatsWithTotals;
    
    newSeasonStats.forEach(row => {
      playerNames.push(row.name);

      Object.keys(row).forEach(key => {
          if (key === 'season') {
            row[key] = newSeasonId;
          }
          else if (key !== 'name' && key !== 'statversion') {
            row[key] = 0;
          }
      });

      allStatsWithTotals.push(row);
    });

    let seasons = this.state.seasons;
    seasons.push(newSeasonId);

    controller.createNewSeason(newSeasonId, playerNames, statVersion, Object.keys(TrackedStats[statVersion]));

    this.setState({
      allStatsWithTotals,
      selectedSeasonStats: newSeasonStats,
      selectedSeason: newSeasonId,
      seasonInProgress: newSeasonId,
      seasons,
      kingPoints: 0,
      zombiewins: 0
    });
  }

  addNewPlayer = (playerName) => {
    let newRow = Object.assign({}, this.state.selectedSeasonStats[0]);
    Object.keys(newRow).forEach(key => {
      if (key === 'name') {
        newRow[key] = playerName;
      }
      else if (key === 'statversion' || key === 'season') {
        // keep copied value
      } else {
        newRow[key] = '0';
      }
      newRow.totalPoints = 0;
    });

    let selectedSeasonStats = this.state.selectedSeasonStats;
    selectedSeasonStats.push(newRow);
    let allStatsWithTotals = this.state.allStatsWithTotals;
    allStatsWithTotals.push(newRow);

    controller.addPlayer(newRow.season, [playerName], newRow.statversion, Object.keys(TrackedStats[newRow.statversion]));

    this.setState({
      allStatsWithTotals,
      selectedSeasonStats
    });
  }
}

const styles = theme => ({
  expand: {
    transform: 'rotate(0deg)',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
    marginLeft: 'auto',
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  }
});

export default withStyles(styles)(UndeadDarts);
