const parse = require('@babel/parser').parse;
const traverse = require("@babel/traverse").default;

module.exports = function (source) {
  const injections = {};
  const positions = [];
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['classProperties', 'jsx', 'typescript']
  });
  traverse(ast, {
    ClassMethod(path) {
      if (path.node.key.name.startsWith('render')) {
        traverse(path.node, {
          JSXIdentifier(subpath) {
            if (/^[A-Z]/.test(subpath.node.name)) {
              if (!path.scope.hasBinding(subpath.node.name)) {
                const start = path.node.body.body[0].start;
                if (!positions.includes(start)) {
                  positions.push(start);
                }
                if (!injections[start]) {
                  injections[start] = [];
                }
                if (!injections[start].includes(subpath.node.name)) {
                  injections[start].push(subpath.node.name);
                }
              }
            }
          },
        }, path.scope, path);
      }
    }
  });
  positions.reverse();
  positions.push(0);
  let outputs = [];
  let last;
  for (const position of positions) {
    let code = source.slice(position, last);
    last = position;
    outputs.push(code);
    if (position) {
      for (const injection of injections[position]) {
        if (injection) {
          outputs.push(`const ${injection} = this.render${injection};\n    `)
        }
      }
    }
  }
  return outputs.reverse().join('');
}