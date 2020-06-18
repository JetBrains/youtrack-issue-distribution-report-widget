module.exports = {
  extends: '@jetbrains/stylelint-config',
  rules: {
    //todo: move to default and fix problems!!
    'selector-max-specificity': '1,2,0',
    'at-rule-no-unknown': [
      true,
      {ignoreAtRules: ['if', 'extend', 'each', 'else']}
    ]
  }
};
