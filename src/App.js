import React, { Component } from 'react';
import moment from 'moment';
import './App.css';
import helpers from './lib/helpers.js';
import Table, { TableBody, TableCell, TableRow } from 'material-ui/Table';
import Reboot from 'material-ui/Reboot';
import 'typeface-roboto';
import ChangeHistory from './components/ChangeHistory.js';
import SeasonSelector from './components/SeasonSelector.js';
import ZombieInput from './components/ZombieInput.js';
import AppHeader from './components/AppHeader.js';
import PlayerStats from './components/PlayerStats.js'

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      stats: [],
      season: '28',
      changelog: [],
      kingPoints: 0,
      zombiewins: 0
    };

    this.onCellChange = this.onCellChange.bind(this);
    this.getData = this.getData.bind(this);
    this.isDaKing = this.isDaKing.bind(this);
  }

  componentDidMount() {
    this.getData(this.state.season);

    helpers.getChangelog()
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
                 <ZombieInput zombiewins={this.state.zombiewins} onCellChange={this.onCellChange} season={this.state.season} />
               </TableCell>
               <TableCell>
                 <SeasonSelector season={this.state.season} getData={this.getData} />
               </TableCell>
          </TableRow>
        </TableBody>
      </Table>
        <PlayerStats stats={this.state.stats} kingPoints={this.state.kingPoints} isDaKing={this.isDaKing} onCellChange={this.onCellChange}/>
        <ChangeHistory changelog={this.state.changelog}/>
      </div>
    );
  }

  onCellChange(modifiedColumn, modifiedRow, newValue) {
    let newStats = this.state.stats;
    newStats.filter(x => x.name === modifiedRow.name)[0][modifiedColumn] = newValue;

    let changeDescription = modifiedRow.name + ':' + modifiedRow.season + ':' + modifiedColumn + ':' + newValue;
    let ts = moment().format('YYYY-MM-DD HH:mm:ss');

    let obj = {
      name: modifiedRow.name,
      season: modifiedRow.season,
      field: modifiedColumn,
      value: newValue,
      timestamp: ts,
      change: changeDescription
    };
    let body = 'data=' + JSON.stringify(obj);
    helpers.updateStats(body);

    let newLog = this.state.changelog;
    newLog.unshift({message: changeDescription, timestamp: ts});

    let newStatsWithTotals = helpers.setTotalPointsFor(newStats, [modifiedRow.name]);
    let highScore = helpers.getKingTotal(newStatsWithTotals);
    let zombiewins = newStatsWithTotals.filter(x => x.name === 'ZOMBIES')[0].zombiewins;
    
    this.setState({stats: newStatsWithTotals, changelog: newLog, kingPoints: highScore, zombiewins});
  }

  getData(targetSeason) {
    helpers.getAllStats(targetSeason)
      .then(res => {
        let statsWithTotals = helpers.setTotalPointsFor(res.data);
        let highScore = helpers.getKingTotal(statsWithTotals);
        let zwins = statsWithTotals.filter(x => x.name === 'ZOMBIES')[0].zombiewins;
        this.setState({stats: statsWithTotals, season: targetSeason, kingPoints: highScore, zombiewins: zwins});
      });
  }

  isDaKing(playersPoints) {
    return this.state.kingPoints === playersPoints;
  }
}

export default App;
