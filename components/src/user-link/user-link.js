import React from 'react';
import PropTypes from 'prop-types';
import Link from '@jetbrains/ring-ui/components/link/link';
import {
  UserCardTooltip, SmartUserCardTooltip
} from '@jetbrains/ring-ui/components/user-card/user-card';

import {loadUser} from '../resources/resources';

const LinkContent = ({user, homeUrl = ''}) => (
  <Link
    href={`${homeUrl}/users/${user.ringId || user.id}`}
    pseudo={true}
  >
    {
      user.name || user.fullName || user.login
    }
  </Link>
);

LinkContent.propTypes = {
  user: PropTypes.object,
  homeUrl: PropTypes.string
};


const UserLink = (
  {user, homeUrl = '', fetchHub}
) => {
  if (!user.avatarUrl) {
    if (fetchHub) {
      const loadUserDetails = async () => {
        const userDetails = await loadUser(fetchHub, user.ringId || user.id);
        const avatarUrl = userDetails.avatar
          ? userDetails.avatar.url
          : userDetails.avatarUrl;
        return {...userDetails, ...{avatarUrl}};
      };

      return (
        <span>
          <SmartUserCardTooltip userDataSource={loadUserDetails}>
            <LinkContent user={user} homeUrl={homeUrl}/>
          </SmartUserCardTooltip>
        </span>
      );
    }

    return <LinkContent user={user} homeUrl={homeUrl}/>;
  }

  return (
    <span>
      <UserCardTooltip user={{
        login: user.login,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        href: `${homeUrl}/users/${user.ringId}`
      }}
      >
        <LinkContent user={user} homeUrl={homeUrl}/>
      </UserCardTooltip>
    </span>
  );
};

UserLink.propTypes = {
  user: PropTypes.object.isRequired,
  homeUrl: PropTypes.string,
  fetchHub: PropTypes.func
};

export default UserLink;
