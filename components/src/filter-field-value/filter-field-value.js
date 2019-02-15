import React from 'react';
import PropTypes from 'prop-types';
import {UserCardTooltip} from '@jetbrains/ring-ui/components/user-card/user-card';
import Link from '@jetbrains/ring-ui/components/link/link';

import './filter-field-value.scss';

class FilterFieldValue extends React.Component {
  static propTypes = {
    value: PropTypes.object,
    homeUrl: PropTypes.string
  };

  static defaultProps = {
    homeUrl: ''
  };

  render() {
    const {value, homeUrl, ...restOfProps} = this.props;

    if (value.user) {
      return (
        <div
          className="filter-field-label"
          {...restOfProps}
        >
          <UserCardTooltip user={{
            login: value.user.login,
            name: value.user.name,
            email: value.user.email,
            avatarUrl: value.user.avatarUrl,
            href: `${this.props.homeUrl}/users/${value.user.ringId}`
          }}
          >
            <Link
              href={`${homeUrl}/users/${value.user.ringId}`}
              pseudo={true}
            >
              {
                value.user.name || value.user.fullName ||
                value.login
              }
            </Link>
          </UserCardTooltip>
        </div>
      );
    }

    return (
      <div
        className="filter-field-label"
        title={value.name}
        {...restOfProps}
      >
        { value.name }
      </div>
    );
  }
}

export default FilterFieldValue;
