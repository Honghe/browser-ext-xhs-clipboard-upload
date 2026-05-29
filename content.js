// 只处理小红书上传 input
function isXhsUploadInput(el) {
    return (
        el &&
        el.tagName === "INPUT" &&
        el.type === "file" &&
        el.accept.includes(".jpg")
    );
}

// 拦截 file input 点击
function hookFileInputs() {
    // 将`.img-list`下的第一个input的hidden属性去除
    function removeInputHiddenAttribute() {
        const inputs = document.querySelectorAll('.drag-over input[type="file"]');

        inputs.forEach((input) => {
            input.style.opacity = '1';
            input.style.setProperty('width', 'auto', 'important');
            input.style.setProperty('height', 'auto', 'important');
        });

        if (inputs.length) {
            console.log("已去除hidden属性", inputs);
        }
    }

    let removeInputTimer = null;
    function scheduleRemoveInputHiddenAttribute() {
        clearTimeout(removeInputTimer);
        removeInputTimer = setTimeout(removeInputHiddenAttribute, 50);
    }

    const uploadInputObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (
                    node.nodeType === Node.ELEMENT_NODE &&
                    (
                        node.matches?.('.drag-over, input[type="file"]') ||
                        node.querySelector?.('.drag-over input[type="file"]')
                    )
                ) {
                    scheduleRemoveInputHiddenAttribute();
                    return;
                }
            }
        }
    });
    removeInputHiddenAttribute();
    uploadInputObserver.observe(document.documentElement, { childList: true, subtree: true });

    // 添加ctrl+click监听
    document.addEventListener("click", async (e) => {
        const input = e.target;

        if (!isXhsUploadInput(input) || !e.ctrlKey) return;

        e.preventDefault();
        e.stopImmediatePropagation();

        const file = await getImageFromClipboard();
        if (!file) {
            alert("剪贴板中没有图片");
            return;
        }

        injectFile(input, file);
    }, true); // 捕获阶段优先拦截
}

// 从剪贴板读取图片
async function getImageFromClipboard() {
    try {
        const items = await navigator.clipboard.read();

        for (const item of items) {
            for (const type of item.types) {
                if (type.startsWith("image/")) {
                    const blob = await item.getType(type);
                    return new File([blob], "clipboard.png", { type });
                }
            }
        }
    } catch (e) {
        console.error("Clipboard read failed:", e);
    }

    return null;
}

// 注入到 input.files 并触发 change
function injectFile(input, file) {
    const dt = new DataTransfer();
    dt.items.add(file);

    input.files = dt.files;

    // 触发原生 change 事件，让小红书前端继续处理
    const event = new Event("change", { bubbles: true });
    input.dispatchEvent(event);
}

// 启动hook
hookFileInputs();
