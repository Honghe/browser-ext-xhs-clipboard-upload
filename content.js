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
        const imgList = document.querySelector('.img-list');
        if (!imgList) return;
        const input = imgList.querySelector('input[type="file"]');
        if (input && input.hasAttribute('hidden')) input.removeAttribute('hidden');
    }
    // 若.img-list还没渲染出来，则监听document直到出现
    if (document.querySelector('.img-list')) {
        removeInputHiddenAttribute();
    } else {
        const waitImgList = new MutationObserver((mutations, obs) => {
            if (document.querySelector('.img-list')) {
                obs.disconnect();
                removeInputHiddenAttribute();
            }
        });
        waitImgList.observe(document.documentElement, { childList: true, subtree: true });
    }

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
