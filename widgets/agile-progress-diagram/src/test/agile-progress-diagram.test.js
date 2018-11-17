import 'babel-polyfill';

import AgileProgressDiagramWidget from '../app/widget';

describe('AgileProgressDiagramWidget', () => {

  it('should export widget', () => {
    (AgileProgressDiagramWidget).should.be.a('function');
  });
});
