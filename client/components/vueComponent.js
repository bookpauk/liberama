import { defineComponent } from 'vue';

export default function(componentClass) {
    const comp = {};
    const obj = new componentClass();
    
    //data, options, props
    const data = {};
    for (const prop of Object.getOwnPropertyNames(obj)) {
        if (['_options', '_props'].includes(prop)) {//meta props
            if (prop === '_options') {
                const options = obj[prop];
                for (const optName of ['components', 'watch']) {
                    if (options[optName]) {
                        comp[optName] = options[optName];
                    }
                }
            } else if (prop === '_props') {
                comp['props'] = obj[prop];
            }
        } else {//usual prop
            data[prop] = obj[prop];
        }
    }
    comp.data = () => data;
    
    //methods
    const classProto = Object.getPrototypeOf(obj);
    const classMethods = Object.getOwnPropertyNames(classProto);
    const methods = {};
    const computed = {};
    for (const method of classMethods) {
        const desc = Object.getOwnPropertyDescriptor(classProto, method);
        if (desc.get) {//has getter, computed
            computed[method] = {get: desc.get};
            if (desc.set)
                computed[method].set = desc.set;
        } else if (!['constructor', 'vueOptions'].includes(method)) {//usual
            methods[method] = obj[method];
        }
    }
    comp.methods = methods;
    comp.computed = computed;

    console.log(comp);
    return defineComponent(comp);
}
