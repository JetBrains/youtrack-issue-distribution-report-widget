import React from 'react';
import PropTypes from 'prop-types';

const SpentTimeValue = ({value}) => (
  value ? <span>{value.presentation}</span> : ''
);

SpentTimeValue.propTypes = {
  value: PropTypes.any
};

export default SpentTimeValue;
