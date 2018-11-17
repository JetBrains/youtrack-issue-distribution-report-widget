import '@jetbrains/ring-ui/components/form/form.scss';

import React from 'react';
import PropTypes from 'prop-types';
import Select from '@jetbrains/ring-ui/components/select/select';
import List from '@jetbrains/ring-ui/components/list/list';
import Link from '@jetbrains/ring-ui/components/link/link';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import {
  loadAgiles
} from '../../../../components/src/resources/resources';

import {
  areSprintsEnabled,
  isCurrentSprint,
  getCurrentSprint
} from './agile-board-model';

class SelectBoardForm extends React.Component {
  static propTypes = {
    agile: PropTypes.object,
    sprint: PropTypes.object,
    currentSprintMode: PropTypes.bool,
    onChange: PropTypes.func,
    dashboardApi: PropTypes.object,
    youTrackId: PropTypes.string
  };

  static toSelectItem = it => it && {
    key: it.id,
    label: it.name,
    description: it.homeUrl,
    model: it
  };

  static getCurrentSprintSelectOption = currentSprint => ({
    key: 'current-sprint',
    label: i18n('Always display current sprint'),
    description: currentSprint ? currentSprint.name : ''
  });

  constructor(props) {
    super(props);

    const selectedYouTrack = {
      id: props.youTrackId
    };
    this.state = {
      selectedAgile: props.agile,
      selectedSprint: props.sprint,
      currentSprintMode: props.currentSprintMode,
      agiles: [],
      selectedYouTrack
    };
  }

  componentDidMount() {
    this.loadAgiles();
  }

  async loadAgiles() {
    const {selectedAgile, selectedSprint} = this.state;
    this.setState({agiles: [], selectedAgile: null, selectedSprint: null});
    const agiles = await loadAgiles(this.fetchYouTrack);
    const hasRememberedAgileInNewAgilesList = (agiles || []).
      some(agile => selectedAgile && selectedAgile.id === agile.id);
    this.setState({agiles});
    if (hasRememberedAgileInNewAgilesList) {
      this.setState({
        selectedAgile,
        selectedSprint
      });
    } else if (agiles.length) {
      this.changeAgile(agiles[0]);
    }
  }

  fetchYouTrack = async (url, params) => {
    const {dashboardApi} = this.props;
    const {selectedYouTrack} = this.state;
    return await dashboardApi.fetch(selectedYouTrack.id, url, params);
  };

  changeAgile = selected => {
    const selectedAgile = selected.model || selected;
    const sprints = selectedAgile && selectedAgile.sprints || [];
    if (sprints.length) {
      const hasCurrentSprint = selectedAgile.currentSprint ||
        sprints.some(isCurrentSprint);
      this.changeSprint(
        hasCurrentSprint
          ? SelectBoardForm.getCurrentSprintSelectOption()
          : sprints[0]
      );
    }
    this.setState({selectedAgile});
  };

  changeSprint = selected => {
    if (selected.key === 'current-sprint') {
      this.setState({
        selectedSprint: null,
        currentSprintMode: true
      });
    } else {
      this.setState({
        selectedSprint: selected.model || selected,
        currentSprintMode: false
      });
    }
  };

  renderNoBoardsMessage() {
    const {selectedYouTrack} = this.state;

    return (
      <div className="ring-form__group">
        <span>{i18n('No boards found.')}</span>&nbsp;
        <Link
          href={`${(selectedYouTrack || {}).homeUrl}/agiles/create`}
        >
          {i18n('Create board')}
        </Link>
      </div>
    );
  }

  renderBoardsSelectors() {
    const {
      selectedAgile,
      selectedSprint,
      currentSprintMode,
      agiles
    } = this.state;

    const getSprintsOptions = () => {
      const sprints = (selectedAgile.sprints || []);
      const sprintsOptions = sprints.map(SelectBoardForm.toSelectItem);
      const currentSprint = getCurrentSprint(selectedAgile);
      if (currentSprint) {
        sprintsOptions.unshift({
          rgItemType: List.ListProps.Type.SEPARATOR
        });
        sprintsOptions.unshift(
          SelectBoardForm.getCurrentSprintSelectOption(currentSprint)
        );
      }
      return sprintsOptions;
    };

    return (
      <div>
        <div className="ring-form__group">
          <Select
            size={Select.Size.FULL}
            data={agiles.map(SelectBoardForm.toSelectItem)}
            selected={SelectBoardForm.toSelectItem(selectedAgile)}
            onSelect={this.changeAgile}
            filter={true}
            label={i18n('Select board')}
          />
        </div>
        {
          areSprintsEnabled(selectedAgile) &&
          <div className="ring-form__group">
            <Select
              size={Select.Size.FULL}
              data={getSprintsOptions()}
              selected={
                currentSprintMode
                  ? SelectBoardForm.getCurrentSprintSelectOption()
                  : SelectBoardForm.toSelectItem(selectedSprint)
              }
              onSelect={this.changeSprint}
              filter={true}
              label={i18n('Select sprint')}
            />
          </div>
        }
      </div>
    );
  }

  render() {
    if ((this.state.agiles || []).length > 0) {
      return this.renderBoardsSelectors();
    }
    return this.renderNoBoardsMessage();
  }
}

export default SelectBoardForm;
