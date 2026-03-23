import { useRef, useState, useMemo, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';



const RichTextEditor = ({ initialValue = '', onChange, disabled = false, header = true }: any) => {
    const editorRef = useRef<any>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleTheme = () => {
        setIsDarkMode((prev) => !prev);
    };

    const initConfig = useMemo(() => {
        return {
            height: header ? 600 : 300,
            width: '100%',
            zindex: 9999999,
            placeholder: 'Start typing your content here...',

            menubar: true, // ← This enables top menu bar
            menu: {
                file: { title: 'File', items: 'newdocument restoredraft | preview | print' },
                edit: { title: 'Edit', items: 'undo redo | cut copy paste | selectall | searchreplace' },
                view: { title: 'View', items: 'code | visualaid visualchars | fullscreen' },
                insert: { title: 'Insert', items: 'image link media template pagebreak hr | charmap emoticons | anchor table' },
                format: { title: 'Format', items: 'bold italic underline strikethrough | superscript subscript | align | fontfamily fontsize blocks | forecolor backcolor | removeformat' },
                tools: { title: 'Tools', items: 'spellchecker spellcheckerlanguage | a11ycheck code' },
                table: { title: 'Table', items: 'inserttable | cell row column | tableprops deletetable' },
                help: { title: 'Help', items: 'help' }
            },

            // ✅ Plugins (all essential ones)
            plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'wordcount', 'help',
                'emoticons', 'hr', 'pagebreak', 'nonbreaking', 'quickbars',
                'save', 'directionality', 'visualchars', 'paste'
            ],
            toolbar: header ? `
        undo redo | cut copy paste | selectall | save | print | code | fullscreen | help |
        bold italic underline strikethrough | superscript subscript |
        alignleft aligncenter alignright alignjustify | outdent indent |
        bullist numlist | table | link image media | formatpainter removeformat |
        forecolor backcolor | emoticons | hr pagebreak
      ` : `undo redo | cut copy paste | selectall | save | print | code | fullscreen|bold italic underline | table`,
            toolbar_mode: 'wrap',
            skin: isDarkMode ? 'oxide-dark' : 'oxide',
            content_css: isDarkMode ? 'dark' : 'default',
            branding: false,
            statusbar: true,
            resize: true,
            content_style: `
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          font-size: 16px;
          line-height: 1.6;
          background-color: ${isDarkMode ? '#1a1a1a' : '#fff'};
          color: ${isDarkMode ? '#e0e0e0' : '#333'};
          margin: 0;
          padding: 10px;
        }
        img { max-width: 100%; height: auto; }
        a { color: #409eff; text-decoration: underline; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid ${isDarkMode ? '#555' : '#ccc'}; padding: 8px; }
        code { background: ${isDarkMode ? '#333' : '#f4f4f4'}; padding: 2px 4px; border-radius: 3px; }
        pre { background: ${isDarkMode ? '#2d2d2d' : '#f5f5f5'}; padding: 10px; border: 1px solid #ccc; border-radius: 5px; overflow: auto; }
        .mce-content-body[data-mce-placeholder] { opacity: 0.5; }
      `,

            image_title: true,
            automatic_uploads: false,
            file_picker_types: 'image',
            file_picker_callback: (callback: any, value: any, meta: any) => {
                const input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('accept', 'image/*');

                input.addEventListener('change', (e: any) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.addEventListener('load', () => {
                        const id = 'blobid' + new Date().getTime();
                        const blobCache = editorRef.current.editorUpload.blobCache;
                        const base64 = (reader.result as string).split(',')[1];
                        const blobInfo = blobCache.create(id, file, base64);
                        blobCache.add(blobInfo);
                        callback(blobInfo.blobUri(), { title: file.name });
                    });
                    reader.readAsDataURL(file);
                });

                input.click();
            },

            quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote',
            quickbars_insert_toolbar: 'image media table hr',

            setup: (editor: any) => {
                editorRef.current = editor;

                editor.ui.registry.addButton('themeToggle', {
                    text: isDarkMode ? 'Light Mode' : 'Dark Mode',
                    tooltip: 'Toggle Dark/Light Mode',
                    onAction: toggleTheme,
                });
            },
        };
    }, [isDarkMode]); // ← Re-init config when theme changes

    return (
        <div
            style={{
                position: 'relative',
                border: '1px solid #ccc',
                borderRadius: '8px',
                overflow: 'visible', // ← 🔴 THIS IS CRITICAL: prevent clipping menus
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                maxWidth: '100%',
                margin: '0 auto',
                backgroundColor: isDarkMode ? '#121212' : '#fff',
                fontFamily: 'sans-serif',
            }}
        >
            <style>
                {`
        .tox-tinymce-aux, .tox .tox-menu, .tox .tox-dialog, .tox .tox-pop, .tox .tox-notification {
          z-index: 99999 !important;
        }
        .tox {
          z-index: auto;
        }
        /* Prevent clipping */
        .tiny-mce-container,
        .tiny-mce-container * {
          overflow: visible !important;
        }
      `}
            </style>
            <Editor
                apiKey="cvv7pvo9jpr74j9bcg5j7mt8d0esguhdhw4dc5uoxky2pxdn" // Replace with env var
                value={initialValue && initialValue}
                onEditorChange={(e) => { onChange(e) }}
                init={initConfig}
                disabled={disabled}
            />
        </div>
    );
};

export default RichTextEditor;