import React, {useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import Link from '@jetbrains/ring-ui/components/link/link';
import classNames from 'classnames';
import Tooltip from '@jetbrains/ring-ui/components/tooltip/tooltip';
import LoaderInline from '@jetbrains/ring-ui/components/loader-inline/loader-inline';

import {loadIssue} from '../resources/resources';

import './color-fields.scss';
import './issue-preview.scss';

const isPriorityField = issueField => {
  const fieldPrototype = issueField &&
    (issueField.projectCustomField || {}).field;
  const fieldPrototypeName = fieldPrototype && fieldPrototype.name;
  return (fieldPrototypeName || '').toLowerCase() === 'priority';
};

const getPriorityIssueField = fields =>
  (fields || []).filter(isPriorityField)[0];

// eslint-disable-next-line complexity
const getCustomFieldTextPresentation = (field, noEmptyText) => {
  const value = (field.value && field.value[0]) || field.value;
  if (value) {
    return value.localizedName || value.name || value.fullName ||
      value.login || value || '';
  }
  return noEmptyText
    ? ''
    : (field.projectCustomField || {}).emptyFieldText;
};

const getColorId = field => {
  const value = field && field.value && (
    field.value.length === 1 ? field.value[0] : field.value
  );
  return value && value.color && value.color.id;
};

const getFieldsValuesToDisplay = (fields, priorityField) => {
  const shownFieldsCount = 3;
  const values = (fields || []).
    filter(field =>
      (!priorityField || field.id !== priorityField.id)).
    map(field => toFieldValue(field)).
    filter(it => !!it);

  return values.splice(0, Math.min(values.length, shownFieldsCount));
};

function toFieldValue(field, noEmptyText) {
  const presentation = field &&
    getCustomFieldTextPresentation(field, noEmptyText);
  return presentation
    ? {id: field.id, colorId: getColorId(field), presentation}
    : undefined;
}

// eslint-disable-next-line complexity
const IssueLink = (
  {homeUrl, issue, fetchYouTrack, ...restProps}
) => {
  const [fields, setFields] = useState(issue.fields);
  const [priorityFieldValue, setPriorityFieldValue] = useState(
    toFieldValue(getPriorityIssueField(issue.fields), true)
  );
  const [fieldsValuesToDisplay, setFieldsValuesToDisplay] = useState(
    getFieldsValuesToDisplay(issue.fields, priorityFieldValue)
  );

  useEffect(() => {
    let subscribed = true;

    (async function load() {
      if (!issue.fields || !issue.fields.length) {
        const loadedIssue = await loadIssue(fetchYouTrack, issue.id);
        const newFields = loadedIssue.fields;
        const newPriorityField = getPriorityIssueField(newFields);
        const newFieldsValuesToDisplay =
          getFieldsValuesToDisplay(newFields, newPriorityField);

        if (subscribed) {
          setFields(newFields);
          setPriorityFieldValue(toFieldValue(newPriorityField, true));
          setFieldsValuesToDisplay(newFieldsValuesToDisplay);
        }
      }
    }());

    return () => {
      subscribed = false;
    };
  }, [issue, fetchYouTrack]);

  const priority = priorityFieldValue && (
    <span className={classNames(
      'yt-issue-preview__priority',
      `color-fields__field-${priorityFieldValue.colorId || 'none'}`
    )}
    >
      { (priorityFieldValue.presentation || '')[0] }
    </span>
  );

  const tooltip = (
    <div className="yt-issue-preview">
      <div className="yt-issue-preview__header">
        {
          priority &&
          <span className="yt-issue-preview__priority-wrapper">
            {priority}
          </span>
        }
        <div>
          <Link
            href={`${homeUrl}/issue/${issue.idReadable}`}
            target="_blank"
            className={classNames({
              'yt-issue-preview__id': true,
              'yt-issue-preview__id_resolved': issue.resolved
            })}
          >
            {issue.idReadable}
          </Link>

          <span className="yt-issue-preview__summary">
            {issue.summary}
          </span>
        </div>
      </div>

      <div className="yt-issue-preview__fields">
        {
          (!fields || !fields.length) &&
          <center>
            <LoaderInline/>
          </center>
        }

        {
          (fieldsValuesToDisplay || []).map(({id, presentation, colorId}) => (
            <span
              key={`field-value-${id}`}
              title={presentation}
              className={classNames('yt-issue-preview__field', `color-fields__plain-color-${colorId}`)}
            >
              {presentation}
            </span>
          ))
        }
      </div>
    </div>
  );

  return (
    <Tooltip
      title={tooltip}
      popupProps={{sidePadding: 24}}
    >
      <Link
        href={`${homeUrl}/issue/${issue.idReadable}`}
        target="_blank"
        {...restProps}
      >
        {issue.idReadable}
      </Link>
    </Tooltip>
  );
};

IssueLink.propTypes = {
  issue: PropTypes.object.isRequired,
  homeUrl: PropTypes.string,
  fetchYouTrack: PropTypes.func.isRequired
};

export default IssueLink;
