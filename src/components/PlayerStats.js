import React, { Component } from 'react';
import Card from 'material-ui/Card';
import Button from 'material-ui/Button';

import PlayerRow from './PlayerRow.js';
import ColumnHeaders from './ColumnHeaders';
import InputDialog from './InputDialog';

import './PlayerStats.css';

class PlayerStats extends Component {
  state = {
    playerDialogOpen: false
  }

  handleDialogClick = () => {
    this.setState({playerDialogOpen: true});
  }

  addNewPlayer = (value) => {
    this.setState({playerDialogOpen: false, newSeason: value});
    this.props.addPlayer(value);
  }

  render() {
    let version = this.props.stats.length > 0 ? this.props.stats[0].statversion : 'v1';
    return (
      <Card>
        <table id="StatsTable">
            <ColumnHeaders statversion={version}/>
            <tbody>
              {
                this.props.stats.sort(function(a, b) { return b.totalPoints - a.totalPoints; })
                  .map((row, playerIndex) => {
                  if (row.name !== 'ZOMBIES') {
                    return (
                      <PlayerRow
                        key={playerIndex}
                        row={row}
                        playerIndex={playerIndex}
                        kingPoints={this.props.kingPoints}
                        isDaKing={this.props.isDaKing(row.totalPoints)}
                        onCellChange={this.props.onCellChange}
                        seasonInProgress={this.props.seasonInProgress}
                      />
                    );
                  }
                  return null;
                })
              }
              <tr>
                <td>
                  <Button onClick={this.handleDialogClick}>+</Button>
                  <InputDialog
                    open={this.state.playerDialogOpen}
                    onSave={this.addNewPlayer}
                    title='Add Player'
                  />
                </td>
              </tr>
            </tbody>
        </table>
      </Card>
    );
  }
}

export default PlayerStats;