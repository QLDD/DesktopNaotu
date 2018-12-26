var convert = require('xml-js');
import { 
    renameSync,
    writeFileSync, 
    readFileSync
} from "fs";

/**
 * 转换 xml 文件 --> json
 * @param xml xml 数据
 */
export function xml2km(xml: any) {
    let json = $.xml2json(xml);
    let result = {};
    processTopic(json.node, result);
    return result;    
}

/**
 * 处理 topic
 * @param topic 
 * @param obj 
 */
export function processTopic(topic: any, obj: any) {    

    //处理文本
    obj.data = {
        text: topic.TEXT
    };
    let i;

    // 处理标签
    if (topic.icon) {
        let icons = topic.icon;
        let type;
        if (icons.length && icons.length > 0) {
            for (i in icons) {
                type = markerMap(icons[i].BUILTIN);
                if (type) obj.data[type.str] = type.num;
            }
        } else {
            type = markerMap(icons.BUILTIN);
            if (type) obj.data[type.str] = type.num;
        }
    }

    // 处理超链接
    if (topic.LINK) {
        obj.data.hyperlink = topic.LINK;
    }

    //处理子节点
    if (topic.node) {

        var tmp = topic.node;
        if (tmp.length && tmp.length > 0) { //多个子节点
            obj.children = [];

            for (i in tmp) {
                obj.children.push({});
                processTopic(tmp[i], obj.children[i]);
            }

        } else { //一个子节点
            obj.children = [{}];
            processTopic(tmp, obj.children[0]);
        }
    }
}

/**
 * 标签 map
 * @param name 
 */
function markerMap(name: any) {
    
    let result = {
        str: 'priority',
        num: 0
    };

    switch (name) {
        case 'full-1':
            result.num = 1;
            break;
        case 'full-2':
            result.num = 2;
            break;
        case 'full-3':
            result.num = 3;
            break;
        case 'full-4':
            result.num = 4;
            break;
        case 'full-5':
            result.num = 5;
            break;
        case 'full-6':
            result.num = 6;
            break;
        case 'full-7':
            result.num = 7;
            break;
        case 'full-8':
            result.num = 8;
            break;
        default:
            break;
    }

    return result;
}

/**
 * 打开 FreeMind 格式文件
 * @param fileName 文件路径
 */
export function openFreeMind(fileName: string) {

    let xmlPath = fileName.substring(0, fileName.lastIndexOf('.')) + '.xml';
    renameSync(fileName, xmlPath);

    let xml = readFileSync(xmlPath, 'utf8');    
    let options = { ignoreComment: true, compact: true };
    let result = convert.xml2js(xml, options); 

    let hh: any[] = [];
    let json = {
        root: {
            data: {
                text: ''
            },
            children: hh
        },
        template: 'default',
        theme: 'fresh-blue',
        version: '1.4.43'
    };

    let content = result["map"];
    if (content.node) {
        json.root.data.text = content.node._attributes.TEXT;
    }
    if (content.node.node) {
        json.root.children = getChildren(content.node.node);   
    }  
    
    let str = JSON.stringify(json);       
    let strPath = fileName.substring(0, fileName.lastIndexOf('.')) + '.km';    

    writeFileSync(strPath, str);
    renameSync(xmlPath, fileName); 

    return strPath;
}

/**
 * 解析子节点
 * @param children 子节点
 */
function getChildren(children: any) {
    let childrenArray = [];
    if (children) {
        let nodes = children;                
        if (Array.isArray(nodes)) {
            for (let item of nodes) {                
                if (!item.node) {
                    let childrenItem = {
                        data: {
                            text: item._attributes.TEXT
                        },
                        children: []
                    };
                    childrenArray.push(childrenItem);
                } else {        
                    let hh: any[] = [];            
                    let childrenItem = {
                        data: {
                            text: item._attributes.TEXT
                        },
                        children: hh
                    };                    
                    childrenItem.children = getChildren(item.node) || [];
                    childrenArray.push(childrenItem);
                }
            }
        } else {
            let hh: any[] = [];
            let childrenItem = {
                data: {
                    text: nodes._attributes.TEXT
                },
                children: hh
            };
            if (nodes.node) {
                childrenItem.children = getChildren(nodes.node);
            }
            childrenArray.push(childrenItem);                            
        }        
    }
    return childrenArray;
}