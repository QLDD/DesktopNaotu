import { exportXmindFile } from "./xmind";
import { xml2km } from "./freemind";

export function registerProtocol() {
    // 注册 Xmind
    kityminder.data.registerProtocol('xmind', function() {

        return {
            fileDescription: 'XMind 格式',
            fileExtension: '.xmind',
            dataType: 'blob',
            mineType: 'application/octet-stream',
            
            // 导入
            decode: null,

            // 导出
            encode: function(json: JSON, km: any, options: any) {  
                let fileName = options.filename || 'xmind.xmind';
                exportXmindFile(json, fileName);
            },
            
            recognizePriority: -1
        };
    } ());    

    // 注册 FreeMind
    kityminder.data.registerProtocol('freemind', function() {                                                

        return {
            fileDescription: 'FreeMind 格式',
            fileExtension: '.mm',
            dataType: 'text',            
            
            // 导入
            decode: function(local: any) {                
                return new Promise(function (resolve, reject) {
                    try {
                        resolve(xml2km(local));
                    } catch (e) {
                        reject(new Error('XML 文件损坏！'));
                    }
                });
            },

            // 导出
            encode: function(json: any, km: any, options: any) {  
                return (
                    '<map version="1.0.1">\n' +
                      '<!-- To view this file, download free mind mapping software FreeMind from http://freemind.sourceforge.net -->\n' +
                      genTopic(json.root) +
                    '</map>\n'
                  );
      
                  function genTopic (root:any) {
                    var data = root.data;
                    var attrs = [
                      ['CREATED', data.created],
                      ['ID', data.id],
                      ['MODIFIED', data.created],
                      ['MODIFIED', data.created],
                      ['TEXT', data.text],
                      ['POSITION', data.position]
                    ];
                    return (
                      '<node' + genAttrs(attrs) + '>\n' +
                        (root.children ? root.children.map(genTopic).join('\n') : '') +
                        (data.priority ? ('<icon BUILTIN="full-' + data.priority +'"/>\n') : '') +
                        (data.image ? (
                          '<richcontent TYPE="NODE"><html><head></head><body>\n' +
                            '<img' + genAttrs([['src', data.image], ['width', data.imageSize.width], ['height', data.imageSize.height]]) + '/>\n' +
                          '</body></html></richcontent>\n'
                        ) : '') +
                      '</node>\n'
                    );
                  }
      
                  function genAttrs (pairs:any) {
                    return pairs.map(function (x:any) {
                      return x[1] ? (' ' + x[0] + '="' + x[1] + '"') : ''
                    }).join('');
                  }                                                             
            },
            
            recognizePriority: -1
        };
    } ());
}