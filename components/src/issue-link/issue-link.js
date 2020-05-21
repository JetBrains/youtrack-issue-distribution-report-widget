import React from 'react';
import PropTypes from 'prop-types';
import Link from '@jetbrains/ring-ui/components/link/link';

const IssueLink = (
  {issue}
) => (
  <span>
    <Link href={`issue/${issue.idReadable}`}>
      {issue.idReadable}
    </Link>
    <span>{issue.summary}</span>
  </span>
);

IssueLink.propTypes = {
  issue: PropTypes.object
};

export default IssueLink;
