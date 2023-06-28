import { _decorator, AudioClip, AudioSource, tween, log } from 'cc';
import ExtAsyncTaskMgr from '../async_task/ExtAsyncTaskMgr';
import ExtBaseTask from '../async_task/ExtBaseTask';
import ExtSequenceTask from '../async_task/ExtSequenceTask';
import { ExtAudio } from './ExtAudio';
import ExtScreenManager from '../ui/ExtScreenManager';

export class ExtAudioNativeManager extends ExtAudio {

    constructor() {
        super();
    }

    private _bgmAS: AudioSource = null!;
    private _clipAs: AudioSource = null!;
    private _sfx: { [name: string]: AudioSource } = {};
    private _idSfx = 0;
    private _audiosPool: AudioSource[] = [];

    init(data) {
        this._bgmAS = ExtScreenManager.instance.node.addComponent(AudioSource);
        this._clipAs = ExtScreenManager.instance.node.addComponent(AudioSource);
    }

    playBGM(name: string, fade: boolean = false) {
        // if (this.isMutingMusic) return;

        if (this._bgmAS.playing) {
            this._bgmAS.stop();
        }

        let path = this.musicPath + name;
        let clip = ExtScreenManager.instance.assetBundle.get(path, AudioClip);
        if (clip) {
            let audioSource = this._bgmAS;
            audioSource.clip = clip;
            if (this.isMutingMusic) {
                log("playBGM Native pause " + name)
                // audioSource.pause();
                this._bgmAS.volume = 0;
                this._bgmAS.play();
                audioSource.loop = true;
                setTimeout(() => {
                    this._bgmAS.pause();
                }, 200);
            }
            else {
                log("playBGM Native play " + name)
                audioSource.volume = this._musicVolume;
                audioSource.loop = true;
                if (fade) {
                    this._bgmAS.volume = 0;
                    this._bgmAS.play();
                    this.fade(this._bgmAS, this._musicVolume, ExtAudioNativeManager.FADE_DURATION);
                }
                else {
                    this._bgmAS.volume = this._musicVolume;
                    this._bgmAS.play();
                }
            }
        }
    }

    pauseBGM(fade = true) {
        log("pauseBGM Native");

        if (this._bgmAS.playing) {
            log("pauseBGM Native 2");
            if (!fade) {
                this._bgmAS.pause();
            }
            else {
                this.fade(this._bgmAS, 0, ExtAudioNativeManager.FADE_DURATION, () => {
                    this._bgmAS.pause();
                    // this._bgmAS.volume = this._musicVolume;
                });
            }
        }
    }

    resumeBGM(fade = true) {
        if (this.isMutingMusic) return;
        log("resumeBGM Native");

        if (!this._bgmAS.playing) {
            if (fade) {
                this._bgmAS.volume = 0;
                this._bgmAS.play();
                this.fade(this._bgmAS, this._musicVolume, ExtAudioNativeManager.FADE_DURATION);
            }
            else {
                this._bgmAS.volume = this._musicVolume;
                this._bgmAS.play();
            }
        }
    }

    playClip(name: string, loop: boolean = false, resumeBGM: boolean = true, callback: VoidFunction | null = null) {
        if (this.isMutingEffect) return;

        if (this._clipAs.playing) {
            this._clipAs.stop();
            ExtAsyncTaskMgr.instance.removeTaskByKey('stop_clip');
        }

        let path = this.musicPath + name;
        let clip = ExtScreenManager.instance.assetBundle.get(path, AudioClip);
        if (clip) {
            if (this._bgmAS.playing) {
                this.pauseBGM();
            }
            log("playClip Native " + name);

            let audioSource = this._clipAs;
            audioSource.clip = clip;
            audioSource.volume = this._musicVolume;
            audioSource.loop = loop;
            audioSource.play();

            if (resumeBGM) {
                let sequenceTasks = new ExtSequenceTask();
                sequenceTasks.setKey('stop_clip');
                sequenceTasks.pushTask(new ExtBaseTask(this, this.resumeBGM, [], clip.getDuration()));
                ExtAsyncTaskMgr.instance.executeTask(sequenceTasks);
            }

            if (!loop && callback) {
                // this._clipAs.node.once(AudioSource.EventType.ENDED, callback);
                setTimeout(() => {
                    callback();
                }, clip.getDuration() * 1000);
            }
        }
    }

    stopClip(resumeBGM: boolean = true, callback: VoidFunction | null = null) {
        if (this._clipAs.playing) {
            // this._clipAs.stop();
            this.fade(this._clipAs, 0, ExtAudioNativeManager.FADE_DURATION, () => {
                this._clipAs.stop();
                callback && callback();
            });
        }
        if (resumeBGM) {
            // log("stopClip resume bgm")
            this.resumeBGM();
        }
    }

    playEffect(name: string, loop: boolean = false, callback: VoidFunction | null = null): string | null {
        if (this.isMutingEffect) return;
        // log("playEffect   " + name + "   " + loop);
        let path = this.effectPath + name;
        let clip = ExtScreenManager.instance.assetBundle.get(path, AudioClip);
        if (clip) {
            this._idSfx++;
            let audioSource: AudioSource = null!;
            if (this._audiosPool.length) {
                audioSource = this._audiosPool.shift();
            }
            else {
                audioSource = ExtScreenManager.instance.node.addComponent(AudioSource);
            }

            let sfxName = `${this._idSfx}_${name}`;
            audioSource['sfx_id'] = sfxName;
            audioSource.clip = clip;
            audioSource.volume = this._effectVolume;
            audioSource.loop = loop;
            audioSource['callback'] = callback;
            audioSource.play();
            this._sfx[sfxName] = audioSource;
            log(`playEffect Native: ${ExtScreenManager.instance.node.getComponents(AudioSource).length} - ${Object.keys(this._sfx).length} / ${AudioSource.maxAudioChannel}`);
            if (!loop) {
                setTimeout((sfx_id) => {
                    let as = this._sfx[sfx_id];
                    if (as) {
                        if (as.isValid) {
                            as.stop();
                            // as.destroy();
                            this._audiosPool.push(as);
                        }
                        delete this._sfx[sfx_id];
                        as['callback'] && as['callback']();
                        log(`remainEffects Native: ${ExtScreenManager.instance.node.getComponents(AudioSource).length} - ${Object.keys(this._sfx).length} / ${AudioSource.maxAudioChannel}`);
                    }
                }, clip.getDuration() * 1000, sfxName);
            }
            return sfxName;
        }
        return null;
    }

    stopEffect(sfxId: string, fade: boolean = false): boolean {
        log(`Audio Native Manager stopEffect: ${sfxId}`);

        let audioSource = this._sfx[sfxId];
        if (audioSource) {
            if (audioSource.playing && fade) {
                this.fade(audioSource, 0, ExtAudioNativeManager.FADE_DURATION, () => {
                    // audioSource.isValid && audioSource.destroy();
                    if (audioSource.isValid) {
                        audioSource.stop();
                        this._audiosPool.push(audioSource);
                        // setTimeout(() => {
                        //     audioSource.destroy();
                        // }, 100);
                    }
                    delete this._sfx[sfxId];
                    log(`Audio Native Manager stopEffect 1: ${sfxId}`);
                });
            }
            else {
                // audioSource.isValid && audioSource.destroy();
                if (audioSource.isValid) {
                    audioSource.stop();
                    this._audiosPool.push(audioSource);

                    // setTimeout(() => {
                    //     audioSource.destroy();
                    // }, 100);
                }
                delete this._sfx[sfxId];
                log(`Audio Native Manager stopEffect 2: ${sfxId}`);
            }

            return true;
        }
        return false;
    }

    stopEffectByName(name: string, fade: boolean = false): boolean {
        log(`Audio Native Manager stopEffectByName: ${name}`);
        let audios = Object.values(this._sfx);
        let ret = true;
        for (let sfx of audios) {
            if (sfx && sfx['sfx_id'].includes(name)) {
                log(`stopEffectByName:${sfx['sfx_id']}`);
                ret = ret && this.stopEffect(sfx['sfx_id']);
            }
        }

        return ret;
    }

    resumeEffect(sfxId: string, fade: boolean = false) {
        log("Audio Native Manager resumeEffect");
        let audioSource = this._sfx[sfxId];
        if (audioSource && !audioSource.playing) {
            if (fade) {
                audioSource.volume = 0;
                audioSource.play();
                this.fade(audioSource, this._effectVolume, ExtAudioNativeManager.FADE_DURATION);
            }
            else {
                audioSource.volume = this._effectVolume;
                audioSource.play();
            }
        }
    }

    pauseEffect(sfxId: string, fade: boolean = false) {
        log("Audio Manager pauseEffect");
        let audioSource = this._sfx[sfxId];
        if (audioSource && audioSource.playing) {
            if (fade) {
                this.fade(audioSource, 0, ExtAudioNativeManager.FADE_DURATION, () => {
                    audioSource.pause();
                });
            }
            else {
                audioSource.pause();
            }
        }
    }

    stopAllEffects(fade: boolean = false) {
        Object.keys(this._sfx).forEach(idSfx => {
            this.stopEffect(idSfx, fade);
        });
    }

    pauseAllEffects(fade: boolean = false) {
        let audios = Object.values(this._sfx);
        audios.forEach(audioSource => {
            audioSource && this.pauseEffect(audioSource['sfx_id'], fade);
        });
    }

    resumeAllEffects(fade: boolean = false) {
        let audios = Object.values(this._sfx);
        audios.forEach(audioSource => {
            audioSource && this.resumeEffect(audioSource['sfx_id'], fade);
        });
    }

    fade(audioSource: AudioSource, volume: number, duration: number, callback: VoidFunction | null = null) {
        tween(audioSource)
            .to(duration, { volume: volume })
            .call(() => {
                callback && callback();
            })
            .start();
    }

    destroy() {
        this._sfx = {};
        this._audiosPool.length = 0;
    }

}
