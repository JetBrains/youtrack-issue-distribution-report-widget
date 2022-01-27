import '@jetbrains/ring-ui/components/form/form.scss';

import React from 'react';
import PropTypes from 'prop-types';
import Select from '@jetbrains/ring-ui/components/select/select';
import List from '@jetbrains/ring-ui/components/list/list';
import Link from '@jetbrains/ring-ui/components/link/link';
import LoaderInline from '@jetbrains/ring-ui/components/loader-inline/loader-inline';
import HttpErrorHandler from '@jetbrains/hub-widget-ui/dist/http-error-handler';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import {
  loadAgiles
} from '../../../../components/src/resources/resources';
import {
  areSprintsEnabled,
  getCurrentSprint
} from '../../../../components/src/agile-board-model/agile-board-model';

class SelectBoardForm extends React.Component {
  static propTypes = {
    agileId: PropTypes.string,
    sprintId: PropTypes.string,
    onChange: PropTypes.func,
    dashboardApi: PropTypes.object.isRequired,
    youTrack: PropTypes.object.isRequired
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

  static findSprintById = (sprintId, agile) => {
    if (!agile) {
      return null;
    }
    if (!sprintId) {
      return getCurrentSprint(agile);
    }
    return (agile.sprints || []).
      filter(sprint => sprint.id === sprintId)[0];
  };

  constructor(props) {
    super(props);

    this.state = {
      selectedAgile: null,
      selectedSprint: null,
      agiles: [],
      selectedYouTrack: props.youTrack,
      isLoading: true
    };
  }

  componentDidMount() {
    this.loadAgiles();
  }

  componentWillReceiveProps(props) {
    if (props.youTrack &&
      props.youTrack.id !== this.state.selectedYouTrack.id) {
      this.setState(
        {selectedYouTrack: props.youTrack},
        () => this.loadAgiles()
      );
    }
  }

  async loadAgiles() {
    this.setState({isLoading: true});

    let agiles = [];
    let loadAgilesErrorMessage = '';
    try {
      agiles = await loadAgiles(this.fetchYouTrack);
    } catch (err) {
      loadAgilesErrorMessage = HttpErrorHandler.getMessage(err);
    }

    const selectedAgile = (agiles || []).filter(
      agile => this.props.agileId && this.props.agileId === agile.id
    )[0];

    const selectedSprint = this.props.sprintId
      ? SelectBoardForm.findSprintById(this.props.sprintId, selectedAgile)
      : null;

    this.setState({
      agiles,
      selectedAgile,
      selectedSprint,
      loadAgilesErrorMessage,
      isLoading: false
    });
    this.onChange(selectedAgile, selectedSprint);
    if (!selectedAgile) {
      this.changeAgile(agiles[0]);
    }
  }

  fetchYouTrack = async (url, params) => {
    const {dashboardApi} = this.props;
    const {selectedYouTrack} = this.state;
    return await dashboardApi.fetch(selectedYouTrack.id, url, params);
  };

  onChange = (selectedAgile, selectedSprint) =>
    this.props.onChange({
      agileId: (selectedAgile || {}).id,
      sprintId: (selectedSprint || {}).id
    });

  changeAgile = selected => {
    const selectedAgile = selected.model || selected;
    const sprints = selectedAgile && selectedAgile.sprints || [];
    let updatedSprint = null;
    if (sprints.length) {
      const hasCurrentSprint = !!getCurrentSprint(selectedAgile);
      updatedSprint = hasCurrentSprint
        ? SelectBoardForm.getCurrentSprintSelectOption()
        : sprints[0];
      this.setSprint(updatedSprint);
    }
    this.setState({selectedAgile});
    this.onChange(selectedAgile, updatedSprint);
  };

  setSprint = selectedOption => {
    this.setState({
      selectedSprint: selectedOption.key === 'current-sprint'
        ? null
        : selectedOption.model || selectedOption
    });
  };

  changeSprint = selected => {
    this.setSprint(selected);
    this.onChange(this.state.selectedAgile, selected.model || selected);
  };

  renderNoBoardsMessage() {
    const {selectedYouTrack} = this.state;

    return (
      <div className="ring-form__group">
        <span>{i18n('No boards found.')}</span>&nbsp;
        <Link
          href={`${(selectedYouTrack || {}).homeUrl}agiles/create`}
        >
          {i18n('Create board')}
        </Link>
      </div>
    );
  }

  renderLoadingAgilesError() {
    return (
      <div className="ring-form__group">
        <span>{this.state.loadAgilesErrorMessage}</span>&nbsp;
        <span>{i18n('Cannot load list of agile boards.')}</span>
      </div>
    );
  }

  renderBoardsSelectors() {
    const {
      selectedAgile,
      selectedSprint,
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

    const getSelectedSprintOption = () => {
      if (selectedSprint) {
        return SelectBoardForm.toSelectItem(selectedSprint);
      }
      if (!selectedAgile || !selectedAgile.sprints) {
        return undefined;
      }
      return getCurrentSprint(selectedAgile)
        ? SelectBoardForm.getCurrentSprintSelectOption()
        : SelectBoardForm.toSelectItem(selectedAgile.sprints[0]);
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
              selected={getSelectedSprintOption()}
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
    if (this.state.isLoading) {
      return <LoaderInline/>;
    }
    if ((this.state.agiles || []).length > 0) {
      return this.renderBoardsSelectors();
    }
    if (this.state.loadAgilesErrorMessage) {
      return this.renderLoadingAgilesError();
    }
    return this.renderNoBoardsMessage();
  }
}

export default SelectBoardForm;
