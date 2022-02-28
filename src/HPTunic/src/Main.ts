import { EventsClient, EventHandler } from 'modloader64_api/EventHandler';
import { IModLoaderAPI, IPlugin } from 'modloader64_api/IModLoaderAPI';
import { InjectCore } from 'modloader64_api/CoreInjection';
import { IZ64Main } from 'Z64Lib/API/Common/IZ64Main';
import { Interpolator } from '../Interpolator';
import { Buffer } from 'buffer';
import { IOOTCore } from 'Z64Lib/API/OoT/OOTAPI';
import { IZ64Core } from 'Z64Lib/API/Common/Z64API';

const FPSADDR = 0x801C6FA1;
const TUNICADDR = 0x000f7ad8;

let r = new Interpolator();
let g = new Interpolator();
let time : number = 0;

export class HPTunic implements IPlugin {
  ModLoader = {} as IModLoaderAPI;
  name = 'HPTunic';


  @InjectCore() core!: IZ64Main;
  constructor() {}
  preinit(): void {}
  init(): void {}

  postinit(): void {
    r.dampening = 2;
    g.dampening = 2;
  }

  onTick(): void {
    time = time + (this.ModLoader.emulator.rdramRead8(FPSADDR) / 60.0);

    let tunicOffset = TUNICADDR + this.core.OOT!.link.tunic * 3;

    let health = this.core.OOT!.save.health / 4;
    let mHealth = this.core.OOT!.save.heart_containers * 4;
    let healthPercent = (health / mHealth);

    r.targetPosition = (1 - healthPercent) * 255;
    g.targetPosition = healthPercent * 255;

    let r_ = Math.ceil(r.GetPosition(time));
    let g_ = Math.floor(g.GetPosition(time));

    if (r_ > 255) r_ = 255;
    if (r_ < 0) r_ = 0;

    if (g_ > 255) g_ = 255;
    if (g_ < 0) g_ = 0;

    this.ModLoader.emulator.rdramWriteBuffer(tunicOffset, Buffer.from([r_, g_, 0])) // More performance in comparison to 3 rdramWrite8 calls
  }

  @EventHandler(EventsClient.ON_INJECT_FINISHED)
  onClient_InjectFinished(evt: any) {}
}
