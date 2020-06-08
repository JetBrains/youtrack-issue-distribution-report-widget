import React, {useCallback, useMemo, useState} from 'react';
import PropTypes from 'prop-types';
import Select from '@jetbrains/ring-ui/components/select/select';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import Anchor from '@jetbrains/ring-ui/components/dropdown/anchor';

import {
  makeDropdownOptions, userGroupToSelectOption, hideUsersFromList
} from './make-dropdown-options';


function formatSelectedOptionsText(
  selectedUsersOrGroups, implicitSelectedUsers = []
) {
  if (!selectedUsersOrGroups.length) {
    return implicitSelectedUsers.length
      ? `${i18n('Owner')} (${makeLabelFromArray(implicitSelectedUsers)})`
      : i18n('Owner');
  }

  const allUsersGroup = (selectedUsersOrGroups || []).
    filter(group => group.allUsersGroup)[0];
  if (allUsersGroup) {
    return allUsersGroup.name;
  }
  return makeLabelFromArray([
    ...hideUsersFromList(selectedUsersOrGroups, implicitSelectedUsers),
    ...implicitSelectedUsers]
  );

  function makeLabelFromArray(usersOrGroups) {
    const names = usersOrGroups.
      filter((s, i, arr) => arr.findIndex(it => it.id === s.id) === i).
      map(s => s.name);

    if (names.length === 1) {
      return names[0];
    }

    const namesToDisplay = 2;
    const othersNum = names.length - namesToDisplay;
    const others = othersNum > 0 ? ` +${othersNum}` : '';

    return `${names[0]}, ${names[1]}${others}`;
  }
}


const SharingSetting = (
  {selected, implicitSelected, getOptions, onChange, disabled}
) => {
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState(null);

  const getAllOptions = useCallback(() => [
    ...selected,
    ...(options && options.bestGroups || []),
    ...(options && options.groups || []),
    ...(options && options.users || [])
  ], [selected, options]);

  const loadValues = useCallback(async (query = '') => {
    setLoading(true);
    setOptions(await getOptions(query));
    setLoading(false);
  }, [getOptions]);

  const onChangeValue = useCallback(selectedOptions => {
    const values = selectedOptions.
      map(selectedOption => getAllOptions().
        find(o => o.id === selectedOption.key));
    onChange(values.filter(v => !!v));
  }, [getAllOptions, onChange]);

  const dropdownOptions = useMemo(() => (
    options ? makeDropdownOptions(options) : []
  ), [options]);

  const hoverTitle = [...selected, ...(implicitSelected || [])].
    map(it => it.name).join(', ');

  const anchor = useCallback(({wrapperProps, buttonProps, popup}) => (
    <span
      {...wrapperProps}
      title={hoverTitle}
    >
      <Anchor
        {...buttonProps}
        data-test="ring-select__focus"
        disabled={disabled}
      >
        { formatSelectedOptionsText(selected, implicitSelected) }
      </Anchor>
      {popup}
    </span>
  ), [selected, implicitSelected]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const passthruFilter = s => s;

  const selectedTagsOptions = (selected || []).map(userGroupToSelectOption);

  return (
    <Select
      type={Select.Type.CUSTOM}
      filter={{
        fn: passthruFilter,
        placeholder: i18n('Filter users, groups, and teams')
      }}
      multiple={true}
      data={dropdownOptions}
      customAnchor={anchor}
      loading={loading}
      popupClassName="sharing-setting__popup"
      selected={selectedTagsOptions}
      onFilter={loadValues}
      disabled={disabled}
      onBeforeOpen={loadValues}
      tags={{
        reset: {
          separator: false,
          label: i18n('Reset to default (owner)')
        }
      }}

      onChange={onChangeValue}
    />
  );
};

SharingSetting.propTypes = {
  selected: PropTypes.array,
  implicitSelected: PropTypes.array,
  getOptions: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default SharingSetting;
