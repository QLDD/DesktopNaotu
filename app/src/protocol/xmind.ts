var archiver = require("archiver");
var convert = require('xml-js');
var unzip = require('unzip2');
import { join, basename } from "path";
import { 
    open, 
    appendFile, 
    close, 
    existsSync, 
    mkdirSync, 
    unlink, 
    createWriteStream, 
    renameSync, 
    writeFileSync, 
    readFileSync, 
    createReadStream 
} from "fs";

var xmindDefault : string = '';
if (typeof process.env.ALLUSERSPROFILE == 'string') {
    xmindDefault = process.env.ALLUSERSPROFILE;
}

/**
 * meta 文件
 */
export function getMeta() {
    let meta = `        
        <?xml version="1.0" encoding="utf-8" standalone="no"?>
        <meta xmlns="urn:xmind:xmap:xmlns:meta:2.0" version="2.0">            
            <Creator>
                <Name>XMind</Name>
                <Version>R3.7.3.201708241944</Version>
            </Creator>
            <Thumbnail>
                <Origin>
                    <X>263</X>
                    <Y>162</Y>
                </Origin>
                <BackgroundColor>#FFFFFF</BackgroundColor>
            </Thumbnail>
        </meta>`;
    return meta;
}

/**
 * 文件描述文件
 */
export function getManifest() {    
    let manifest = `
        <?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <manifest
            xmlns="urn:xmind:xmap:xmlns:manifest:1.0" password-hint="">
            <file-entry full-path="content.xml" media-type="text/xml"/>
            <file-entry full-path="META-INF/" media-type=""/>
            <file-entry full-path="META-INF/manifest.xml" media-type="text/xml"/>
            <file-entry full-path="meta.xml" media-type="text/xml"/>            
        </manifest>`;        
    return manifest;
}

/**
 * 内容文件
 */
export function getContent(data: any) {    
    let content = '';

    if (!data) {
        return '';
    }        

    if (data.root) {
        let childrenData = ``;
        let snapData = ``;

        if (data.root.children && data.root.children.length > 0) {
            for (let item of data.root.children) {                    
                snapData = snapData + getContent(item);
            }
            childrenData = `
            <children>
                <topics type="attached">
                    ${snapData} 
                </topics>
            </children>`;                
        }

        content = `
        <?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <xmap-content
            xmlns="urn:xmind:xmap:xmlns:content:2.0"
            xmlns:fo="http://www.w3.org/1999/XSL/Format"
            xmlns:svg="http://www.w3.org/2000/svg"
            xmlns:xhtml="http://www.w3.org/1999/xhtml"
            xmlns:xlink="http://www.w3.org/1999/xlink" timestamp="1544076877461" version="2.0">
        <sheet id="435gdt41vctnj56n8rv2qbkrcg" theme="1ema0e3kojt4ukk25cj6cp5ihn" timestamp="1544076877461">
        <topic id="${data.root.data.id}" structure-class="org.xmind.ui.map.unbalanced" timestamp="${data.root.data.created}">
            <title>${data.root.data.text}</title>
            ${childrenData}          
            <extensions>
                <extension provider="org.xmind.ui.map.unbalanced">
                    <content>
                        <right-number>3</right-number>
                    </content>
                </extension>
            </extensions>
        </topic>
        <title>画布 1</title>
            </sheet>
        </xmap-content>`;
    } else {  
        let partData = ``;
        let snapData = ``;    

        if (data.children && data.children.length > 0) {                
            for (let item of data.children) {
                snapData = snapData + getContent(item);
            }        
            partData = `
                <children>
                    <topics type="attached">
                        ${snapData}
                    </topics>
                </children>`;
        }

        content = `                       
            <topic id="${data.data.id}" timestamp="${data.data.created}">
                <title>${data.data.text}</title>
                ${partData}                    
            </topic>`;  
    }
    return content;
}

/**
 * 文件存储为 xml 格式
 * @param xml 
 * @param type 文件类型
 */
export function saveToXml(xml: any, type: any) { 
    // 目录层级       
    let firstPath = join(xmindDefault, '/mindMapXmind');
    let secondPath = join(xmindDefault, '/mindMapXmind/test');
    let thirdPath = join(xmindDefault, '/mindMapXmind/test/META-INF');

    if (!existsSync(thirdPath)) {
        if (!existsSync(secondPath)) {
            if (!existsSync(firstPath)) {
                mkdirSync(firstPath);
                mkdirSync(secondPath);
                mkdirSync(thirdPath);
            }
        }
    }        
    
    let xmlPath = join(xmindDefault, `/mindMapXmind/test/${type}.xml`);
    if (type == 'manifest') {
        xmlPath = join(xmindDefault, `/mindMapXmind/test/META-INF/${type}.xml`);
    }

    open(xmlPath, 'a', (err: any, fd: any) => {    
        if (err) {
            throw err;
        }
        appendFile(fd, xml, 'utf8', (err: any) => {
            if (err) {
                throw err;
            }        
            close(fd, (err: any) => {
                if (err) {
                    throw err;
                }
            })       
        });
    });
}

/**
 * 删除临时 xml 文件
 */
export function deleteXmlFile() {

    let metaPath = join(xmindDefault, `/mindMapXmind/test/meta.xml`);        
    let contentPath = join(xmindDefault, `/mindMapXmind/test/content.xml`);
    let manifestPath = join(xmindDefault, `/mindMapXmind/test/META-INF/manifest.xml`);

    // meta
    if (existsSync(metaPath)) {
        unlink(metaPath, (err: any) => {
            if (err) {
                throw err;
            }                         
        });
    }

    // content
    if (existsSync(contentPath)) {
        unlink(contentPath, (err: any) => {
            if (err) {
                throw err;
            }            
        });
    }

    // manifest
    if (existsSync(manifestPath)) {
        unlink(manifestPath, (err: any) => {
            if (err) {
                throw err;                    
            }            
        });
    }
    return ;
}

/**
 * 导出 xmind 文件
 * @param json 
 * @param fileName 
 */
export function exportXmindFile(json: JSON | any, fileName: string) {
        
    saveToXml(getContent(json), 'content');
    saveToXml(getManifest(), 'manifest');
    saveToXml(getMeta(), 'meta');            
    
    let pathZip = join(xmindDefault, `/mindMapXmind/testXmind.zip`);
    let pathFile = join(xmindDefault, '/mindMapXmind/test/');              
    let pathxmind = fileName;
    let pathXmind = join(xmindDefault, `/mindMapXmind/${basename(pathxmind)}`);
    let output = createWriteStream(pathZip);
    let archive = archiver('zip', {
        zlib: { level: 9 }
    });

    archive.on('error', function(err: any) {
        throw err;
    });

    output.on('close', function() {
        renameSync(pathZip, pathXmind);
        let readFile = readFileSync(pathXmind);
        writeFileSync(pathxmind, readFile);                                        
        deleteXmlFile();
    });

    archive.pipe(output);
    archive.directory(pathFile, false);
    archive.finalize();
}

/**
 * 打开 xmind 文件
 * @param fileName 
 * @param method 
 */
export function openXmind(fileName: string, method: Function) {
    // xmindAction 目录层级
    let firstPath = join(xmindDefault, '/tmXmindAction');
    let secondPath = join(xmindDefault, '/tmXmindAction/content.xml');
    if (!existsSync(firstPath)) {
        mkdirSync(firstPath);
    } 

    // 解压 
    let unzip_extract = unzip.Extract({ path: firstPath });
    
    unzip_extract.on('error',(err: any)=>{
        console.log(err);
    });
    
    unzip_extract.on('finish',()=>{
        console.log('解压完成');
    });

    unzip_extract.on('close',()=>{        
        let xml = readFileSync(secondPath, 'utf8');
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

        let content = result["xmap-content"];
        if (content.sheet.topic) {
            json.root.data.text = content.sheet.topic.title._text;
        }
        json.root.children = getchildren(content.sheet.topic.children);  
        
        let str = JSON.stringify(json);           
        let strPath = fileName.substring(0, fileName.lastIndexOf('.')) + '.km';        
        
        writeFileSync(strPath, str);          
        method(strPath);        
    });
    createReadStream(fileName).pipe(unzip_extract);          
}

function getchildren (children: any) {
    let childrenArray = [];
    if (children) {
        let topics = children.topics;
        let topic = children.topics.topic;
        if (Array.isArray(topics)) {
            topic = [];
            for (let item of topics) {
                if (Array.isArray(item.topic)) {
                    for (let i of item.topic) {
                        topic.push(i);
                    }
                } else {
                    topic.push(item.topic);
                }                
            }
        }
        if (Array.isArray(topic)) {
            for (let item of topic) {
                if (!item.title) {
                    item.title = { _text: 'null' };
                }
                if (!item.children) {
                    let childrenItem = {
                        data: {
                            text: item.title._text
                        },
                        children: []
                    };
                    childrenArray.push(childrenItem);
                } else {        
                    let hh: any[] = [];            
                    let childrenItem = {
                        data: {
                            text: item.title._text
                        },
                        children: hh
                    };                    
                    childrenItem.children = getchildren(item.children) || [];
                    childrenArray.push(childrenItem);
                }
            }
        } else {
            let hh: any[] = [];
            let childrenItem = {
                data: {
                    text: topic.title._text
                },
                children: hh
            };
            if (topic.children) {
                childrenItem.children = getchildren(topic.children);
            }
            childrenArray.push(childrenItem);                            
        }        
    }
    return childrenArray;
}